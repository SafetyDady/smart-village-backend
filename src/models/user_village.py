"""
User-Village Assignment Model for Smart Village Management System
Handles the many-to-many relationship between users and villages
"""

from src.models.user import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import event

class UserVillage(db.Model):
    """User-Village assignment model for managing user access to villages"""
    __tablename__ = 'user_villages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    village_id = db.Column(db.String(36), db.ForeignKey('villages.id', ondelete='CASCADE'), nullable=False)
    
    # Assignment Details
    assigned_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    assignment_type = db.Column(db.String(20), default='manual')  # manual, invitation, bulk
    
    # Permissions Scope
    can_manage_properties = db.Column(db.Boolean, default=True)
    can_manage_residents = db.Column(db.Boolean, default=True)
    can_manage_finances = db.Column(db.Boolean, default=True)
    can_view_reports = db.Column(db.Boolean, default=True)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)  # Primary village for the user
    
    # Timestamps
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    activated_at = db.Column(db.DateTime)
    deactivated_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('src.models.user_model.User', foreign_keys=[user_id], backref='village_assignments')
    assigner = db.relationship('src.models.user_model.User', foreign_keys=[assigned_by], backref='assigned_villages')
    
    # Constraints
    __table_args__ = (
        db.UniqueConstraint('user_id', 'village_id', name='unique_user_village'),
        db.CheckConstraint('assigned_at <= COALESCE(activated_at, CURRENT_TIMESTAMP)', name='check_assigned_before_activated'),
        db.CheckConstraint('activated_at <= COALESCE(deactivated_at, CURRENT_TIMESTAMP)', name='check_activated_before_deactivated'),
    )
    
    def __init__(self, **kwargs):
        super(UserVillage, self).__init__(**kwargs)
        if self.is_active and not self.activated_at:
            self.activated_at = datetime.utcnow()
    
    def activate(self):
        """Activate the assignment"""
        self.is_active = True
        self.activated_at = datetime.utcnow()
        self.deactivated_at = None
    
    def deactivate(self):
        """Deactivate the assignment"""
        self.is_active = False
        self.deactivated_at = datetime.utcnow()
        
        # If this was the primary village, unset it
        if self.is_primary:
            self.is_primary = False
    
    def set_as_primary(self):
        """Set this village as primary for the user"""
        # First, unset any existing primary village for this user
        existing_primary = UserVillage.query.filter_by(
            user_id=self.user_id,
            is_primary=True
        ).filter(UserVillage.id != self.id).first()
        
        if existing_primary:
            existing_primary.is_primary = False
        
        # Set this as primary
        self.is_primary = True
    
    def update_permissions(self, **permissions):
        """Update village-specific permissions"""
        for key, value in permissions.items():
            if hasattr(self, key) and key.startswith('can_'):
                setattr(self, key, value)
    
    def get_permissions_summary(self):
        """Get summary of permissions for this village assignment"""
        return {
            'can_manage_properties': self.can_manage_properties,
            'can_manage_residents': self.can_manage_residents,
            'can_manage_finances': self.can_manage_finances,
            'can_view_reports': self.can_view_reports
        }
    
    def has_village_permission(self, permission_type):
        """Check if user has specific village permission"""
        permission_map = {
            'properties': self.can_manage_properties,
            'residents': self.can_manage_residents,
            'finances': self.can_manage_finances,
            'reports': self.can_view_reports
        }
        return permission_map.get(permission_type, False)
    
    @property
    def is_expired(self):
        """Check if assignment is expired (deactivated)"""
        return not self.is_active or (self.deactivated_at and self.deactivated_at <= datetime.utcnow())
    
    @property
    def duration_days(self):
        """Get duration of assignment in days"""
        if self.deactivated_at:
            end_date = self.deactivated_at
        else:
            end_date = datetime.utcnow()
        
        start_date = self.activated_at or self.assigned_at
        return (end_date - start_date).days
    
    def to_dict(self, include_user=False, include_village=False, include_assigner=False):
        """Convert assignment to dictionary"""
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'village_id': str(self.village_id),
            'assignment_type': self.assignment_type,
            
            # Permissions
            'permissions': self.get_permissions_summary(),
            
            # Status
            'is_active': self.is_active,
            'is_primary': self.is_primary,
            'is_expired': self.is_expired,
            
            # Timestamps
            'assigned_at': self.assigned_at.isoformat(),
            'activated_at': self.activated_at.isoformat() if self.activated_at else None,
            'deactivated_at': self.deactivated_at.isoformat() if self.deactivated_at else None,
            'duration_days': self.duration_days,
            
            # Assignment details
            'assigned_by': str(self.assigned_by)
        }
        
        # Include related objects if requested
        if include_user and self.user:
            data['user'] = {
                'id': str(self.user.id),
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.full_name
            }
        
        if include_village and self.village:
            data['village'] = self.village.to_summary()
        
        if include_assigner and self.assigner:
            data['assigner'] = {
                'id': str(self.assigner.id),
                'username': self.assigner.username,
                'full_name': self.assigner.full_name
            }
        
        return data
    
    @classmethod
    def get_user_villages(cls, user_id, active_only=True):
        """Get all villages assigned to a user"""
        query = cls.query.filter_by(user_id=user_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()
    
    @classmethod
    def get_village_users(cls, village_id, active_only=True):
        """Get all users assigned to a village"""
        query = cls.query.filter_by(village_id=village_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()
    
    @classmethod
    def get_user_primary_village(cls, user_id):
        """Get user's primary village assignment"""
        return cls.query.filter_by(
            user_id=user_id,
            is_primary=True,
            is_active=True
        ).first()
    
    @classmethod
    def check_user_village_access(cls, user_id, village_id):
        """Check if user has access to specific village"""
        assignment = cls.query.filter_by(
            user_id=user_id,
            village_id=village_id,
            is_active=True
        ).first()
        return assignment is not None
    
    @classmethod
    def assign_user_to_village(cls, user_id, village_id, assigned_by_id, **permissions):
        """Create or update user-village assignment"""
        # Check if assignment already exists
        existing = cls.query.filter_by(
            user_id=user_id,
            village_id=village_id
        ).first()
        
        if existing:
            # Update existing assignment
            existing.activate()
            existing.assigned_by = assigned_by_id
            existing.assigned_at = datetime.utcnow()
            existing.update_permissions(**permissions)
            return existing
        else:
            # Create new assignment
            assignment = cls(
                user_id=user_id,
                village_id=village_id,
                assigned_by=assigned_by_id,
                **permissions
            )
            db.session.add(assignment)
            return assignment
    
    @classmethod
    def bulk_assign_villages(cls, user_id, village_ids, assigned_by_id, **permissions):
        """Assign user to multiple villages"""
        assignments = []
        for village_id in village_ids:
            assignment = cls.assign_user_to_village(
                user_id=user_id,
                village_id=village_id,
                assigned_by_id=assigned_by_id,
                **permissions
            )
            assignments.append(assignment)
        
        # Set first village as primary if no primary exists
        if assignments and not cls.get_user_primary_village(user_id):
            assignments[0].set_as_primary()
        
        return assignments
    
    @classmethod
    def remove_user_from_village(cls, user_id, village_id):
        """Remove user from village (deactivate assignment)"""
        assignment = cls.query.filter_by(
            user_id=user_id,
            village_id=village_id
        ).first()
        
        if assignment:
            assignment.deactivate()
            return True
        return False
    
    @classmethod
    def get_assignments_by_assigner(cls, assigner_id, active_only=True):
        """Get all assignments made by a specific user"""
        query = cls.query.filter_by(assigned_by=assigner_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(cls.assigned_at.desc()).all()
    
    def __repr__(self):
        status = "Active" if self.is_active else "Inactive"
        primary = " (Primary)" if self.is_primary else ""
        return f'<UserVillage {self.user_id} -> {self.village_id} [{status}]{primary}>'

# Event listeners
@event.listens_for(UserVillage, 'before_insert')
def set_activated_at_on_insert(mapper, connection, target):
    """Set activated_at when creating active assignment"""
    if target.is_active and not target.activated_at:
        target.activated_at = datetime.utcnow()

@event.listens_for(UserVillage, 'before_update')
def handle_activation_changes(mapper, connection, target):
    """Handle activation/deactivation changes"""
    # If being activated and no activated_at, set it
    if target.is_active and not target.activated_at:
        target.activated_at = datetime.utcnow()
    
    # If being deactivated and no deactivated_at, set it
    if not target.is_active and target.activated_at and not target.deactivated_at:
        target.deactivated_at = datetime.utcnow()

