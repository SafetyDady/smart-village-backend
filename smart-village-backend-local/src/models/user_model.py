from src.models.user import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import event

# Association tables for many-to-many relationships
user_roles = db.Table('user_roles',
    db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', UUID(as_uuid=True), db.ForeignKey('roles.id'), primary_key=True)
)

role_permissions = db.Table('role_permissions',
    db.Column('role_id', UUID(as_uuid=True), db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', UUID(as_uuid=True), db.ForeignKey('permissions.id'), primary_key=True)
)

class User(db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Personal Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verified_at = db.Column(db.DateTime)
    
    # Security
    last_login = db.Column(db.DateTime)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
                           backref=db.backref('users', lazy=True))
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.roles:
            # Assign default role
            default_role = Role.query.filter_by(name='user').first()
            if default_role:
                self.roles.append(default_role)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
        self.password_changed_at = datetime.utcnow()
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def is_locked(self):
        """Check if account is locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        self.failed_login_attempts = 0
    
    def unlock_account(self):
        """Unlock account"""
        self.locked_until = None
        self.failed_login_attempts = 0
    
    def increment_failed_login(self):
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.lock_account()
    
    def reset_failed_login(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
    
    def has_role(self, role_name):
        """Check if user has specific role (case-insensitive)"""
        return any(role.name.lower() == role_name.lower() for role in self.roles)
    
    def has_permission(self, permission_name):
        """Check if user has specific permission"""
        for role in self.roles:
            if any(perm.name == permission_name for perm in role.permissions):
                return True
        return False
    
    def get_permissions(self):
        """Get all permissions for user"""
        permissions = set()
        for role in self.roles:
            for permission in role.permissions:
                permissions.add(permission.name)
        return list(permissions)
    
    @property
    def full_name(self):
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_superadmin(self):
        """Check if user is superadmin"""
        return self.has_role('superadmin')
    
    @property
    def is_admin(self):
        """Check if user is admin or superadmin"""
        return self.has_role('admin') or self.has_role('superadmin')
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'address': self.address,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'email_verified_at': self.email_verified_at.isoformat() if self.email_verified_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'roles': [role.name for role in self.roles],
            'permissions': self.get_permissions()
        }
        
        if include_sensitive:
            data.update({
                'failed_login_attempts': self.failed_login_attempts,
                'locked_until': self.locked_until.isoformat() if self.locked_until else None,
                'password_changed_at': self.password_changed_at.isoformat() if self.password_changed_at else None
            })
        
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'

class Role(db.Model):
    """Role model for role-based access control"""
    __tablename__ = 'roles'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_system_role = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = db.relationship('Permission', secondary=role_permissions, lazy='subquery',
                                 backref=db.backref('roles', lazy=True))
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'is_system_role': self.is_system_role,
            'permissions': [perm.name for perm in self.permissions],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Role {self.name}>'

class Permission(db.Model):
    """Permission model for fine-grained access control"""
    __tablename__ = 'permissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    resource = db.Column(db.String(50), nullable=False)  # e.g., 'users', 'properties', 'finance'
    action = db.Column(db.String(20), nullable=False)    # e.g., 'create', 'read', 'update', 'delete'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'resource': self.resource,
            'action': self.action,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Permission {self.name}>'

class UserSession(db.Model):
    """User session model for tracking active sessions"""
    __tablename__ = 'user_sessions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    token_jti = db.Column(db.String(36), unique=True, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'token_jti': self.token_jti,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_expired': self.is_expired()
        }

class AuditLog(db.Model):
    """Audit log model for tracking user actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(100))
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id) if self.user_id else None,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat()
        }

# Event listeners for automatic timestamp updates
@event.listens_for(User, 'before_update')
def update_user_timestamp(mapper, connection, target):
    target.updated_at = datetime.utcnow()

@event.listens_for(Role, 'before_update')
def update_role_timestamp(mapper, connection, target):
    target.updated_at = datetime.utcnow()


    # Village-related methods
    def get_assigned_villages(self, active_only=True):
        """Get villages assigned to this user"""
        from src.models.user_village import UserVillage
        from src.models.village import Village
        
        query = db.session.query(Village).join(UserVillage).filter(
            UserVillage.user_id == self.id
        )
        if active_only:
            query = query.filter(UserVillage.is_active == True)
        
        return query.all()
    
    def get_village_assignments(self, active_only=True):
        """Get user-village assignments"""
        from src.models.user_village import UserVillage
        
        query = UserVillage.query.filter_by(user_id=self.id)
        if active_only:
            query = query.filter_by(is_active=True)
        
        return query.all()
    
    def has_village_access(self, village_id):
        """Check if user has access to specific village"""
        # Super admin has access to all villages
        if self.has_role('superadmin'):
            return True
        
        from src.models.user_village import UserVillage
        assignment = UserVillage.query.filter_by(
            user_id=self.id,
            village_id=village_id,
            is_active=True
        ).first()
        
        return assignment is not None
    
    def get_primary_village(self):
        """Get user's primary village"""
        from src.models.user_village import UserVillage
        assignment = UserVillage.query.filter_by(
            user_id=self.id,
            is_primary=True,
            is_active=True
        ).first()
        
        return assignment.village if assignment else None
    
    def has_village_permission(self, village_id, permission_type):
        """Check if user has specific permission for a village"""
        # Super admin has all permissions
        if self.has_role('superadmin'):
            return True
        
        from src.models.user_village import UserVillage
        assignment = UserVillage.query.filter_by(
            user_id=self.id,
            village_id=village_id,
            is_active=True
        ).first()
        
        if not assignment:
            return False
        
        return assignment.has_village_permission(permission_type)
    
    def assign_to_village(self, village_id, assigned_by_id, **permissions):
        """Assign user to a village"""
        from src.models.user_village import UserVillage
        return UserVillage.assign_user_to_village(
            user_id=self.id,
            village_id=village_id,
            assigned_by_id=assigned_by_id,
            **permissions
        )
    
    def remove_from_village(self, village_id):
        """Remove user from a village"""
        from src.models.user_village import UserVillage
        return UserVillage.remove_user_from_village(
            user_id=self.id,
            village_id=village_id
        )
    
    # Emergency Override methods
    def can_emergency_override(self):
        """Check if user can create emergency overrides"""
        return self.has_permission('audit.emergency_override')
    
    def create_emergency_override(self, target_resource, action, reason, 
                                target_id=None, hours=1, ip_address=None, user_agent=None):
        """Create emergency override"""
        if not self.can_emergency_override():
            raise PermissionError("User does not have emergency override permission")
        
        from src.models.emergency_override import EmergencyOverride
        return EmergencyOverride.create_override(
            user_id=self.id,
            target_resource=target_resource,
            action=action,
            reason=reason,
            target_id=target_id,
            hours=hours,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def has_emergency_override(self, resource, target_id, action):
        """Check if user has valid emergency override"""
        from src.models.emergency_override import EmergencyOverride
        override = EmergencyOverride.check_override(
            user_id=self.id,
            resource=resource,
            target_id=target_id,
            action=action
        )
        return override is not None
    
    def get_active_overrides(self):
        """Get user's active emergency overrides"""
        from src.models.emergency_override import EmergencyOverride
        return EmergencyOverride.get_active_overrides(user_id=self.id)
    
    # Enhanced permission checking with village scope
    def has_permission_with_village_scope(self, permission, village_id=None):
        """Check permission with village scope consideration"""
        # Check basic permission first
        if not self.has_permission(permission):
            return False
        
        # Super admin bypasses village scope
        if self.has_role('superadmin'):
            return True
        
        # If village_id is specified, check village access
        if village_id:
            return self.has_village_access(village_id)
        
        # If no village specified, user must have at least one village
        return len(self.get_assigned_villages()) > 0
    
    def check_resource_access(self, resource, action, village_id=None, target_id=None):
        """Comprehensive resource access check"""
        permission = f"{resource}.{action}"
        
        # Check emergency override first
        if self.has_emergency_override(resource, target_id, action):
            return True, "emergency_override"
        
        # Check regular permission with village scope
        if self.has_permission_with_village_scope(permission, village_id):
            return True, "permission_granted"
        
        return False, "access_denied"
    
    # Enhanced to_dict method
    def to_dict_with_villages(self, include_sensitive=False):
        """Convert user to dictionary including village information"""
        data = self.to_dict(include_sensitive=include_sensitive)
        
        # Add village information
        villages = []
        for assignment in self.get_village_assignments():
            village_data = assignment.village.to_summary()
            village_data.update({
                'assignment': assignment.to_dict()
            })
            villages.append(village_data)
        
        data['villages'] = villages
        data['primary_village'] = None
        
        primary_village = self.get_primary_village()
        if primary_village:
            data['primary_village'] = primary_village.to_summary()
        
        # Add emergency override capability
        data['can_emergency_override'] = self.can_emergency_override()
        
        return data

