"""
Village Model for Smart Village Management System
Handles village information and management
"""

from src.models.user import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import event

class Village(db.Model):
    """Village model for managing village information"""
    __tablename__ = 'villages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    address = db.Column(db.Text)
    
    # Geographic Information
    province = db.Column(db.String(50))
    district = db.Column(db.String(50))
    sub_district = db.Column(db.String(50))
    postal_code = db.Column(db.String(10))
    
    # Contact Information
    contact_person = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(100))
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # Metadata
    total_properties = db.Column(db.Integer, default=0)
    total_residents = db.Column(db.Integer, default=0)
    established_date = db.Column(db.Date)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Relationships
    user_assignments = db.relationship('UserVillage', backref='village', lazy=True, cascade='all, delete-orphan')
    creator = db.relationship('src.models.user_model.User', foreign_keys=[created_by], backref='created_villages')
    updater = db.relationship('src.models.user_model.User', foreign_keys=[updated_by], backref='updated_villages')
    
    def __init__(self, **kwargs):
        super(Village, self).__init__(**kwargs)
        # Auto-generate code if not provided
        if not self.code and self.name:
            self.code = self.generate_code()
    
    def generate_code(self):
        """Generate unique village code"""
        # Simple code generation based on name
        base_code = ''.join([c.upper() for c in self.name if c.isalpha()])[:3]
        if len(base_code) < 3:
            base_code = base_code.ljust(3, 'X')
        
        # Find next available number
        counter = 1
        while True:
            code = f"{base_code}{counter:03d}"
            existing = Village.query.filter_by(code=code).first()
            if not existing:
                return code
            counter += 1
    
    def get_assigned_users(self, active_only=True):
        """Get users assigned to this village"""
        query = db.session.query(User).join(UserVillage).filter(
            UserVillage.village_id == self.id
        )
        if active_only:
            query = query.filter(UserVillage.is_active == True)
        return query.all()
    
    def get_village_admins(self):
        """Get village admins assigned to this village"""
        from src.models.user_model import User, Role, user_roles
        return db.session.query(User).join(UserVillage).join(user_roles).join(Role).filter(
            UserVillage.village_id == self.id,
            UserVillage.is_active == True,
            Role.name == 'village_admin'
        ).all()
    
    def assign_user(self, user_id, assigned_by_id, **permissions):
        """Assign a user to this village"""
        from src.models.user_village import UserVillage
        
        # Check if assignment already exists
        existing = UserVillage.query.filter_by(
            user_id=user_id,
            village_id=self.id
        ).first()
        
        if existing:
            # Update existing assignment
            existing.is_active = True
            existing.assigned_by = assigned_by_id
            existing.assigned_at = datetime.utcnow()
            
            # Update permissions
            for key, value in permissions.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            
            return existing
        else:
            # Create new assignment
            assignment = UserVillage(
                user_id=user_id,
                village_id=self.id,
                assigned_by=assigned_by_id,
                **permissions
            )
            db.session.add(assignment)
            return assignment
    
    def unassign_user(self, user_id):
        """Remove user assignment from this village"""
        from src.models.user_village import UserVillage
        assignment = UserVillage.query.filter_by(
            user_id=user_id,
            village_id=self.id
        ).first()
        
        if assignment:
            assignment.is_active = False
            assignment.deactivated_at = datetime.utcnow()
            return True
        return False
    
    def update_statistics(self):
        """Update village statistics (properties, residents)"""
        # This would be implemented based on actual property and resident models
        # For now, just update the timestamp
        self.updated_at = datetime.utcnow()
    
    @property
    def full_address(self):
        """Get full formatted address"""
        parts = [self.address, self.sub_district, self.district, self.province]
        return ', '.join([part for part in parts if part])
    
    @property
    def is_manageable(self):
        """Check if village can be managed (active and verified)"""
        return self.is_active and self.is_verified
    
    def to_dict(self, include_sensitive=False):
        """Convert village to dictionary"""
        data = {
            'id': str(self.id),
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'address': self.address,
            'full_address': self.full_address,
            
            # Geographic Information
            'province': self.province,
            'district': self.district,
            'sub_district': self.sub_district,
            'postal_code': self.postal_code,
            
            # Contact Information
            'contact_person': self.contact_person,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            
            # Status
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'is_manageable': self.is_manageable,
            
            # Metadata
            'total_properties': self.total_properties,
            'total_residents': self.total_residents,
            'established_date': self.established_date.isoformat() if self.established_date else None,
            
            # Timestamps
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data.update({
                'created_by': str(self.created_by) if self.created_by else None,
                'updated_by': str(self.updated_by) if self.updated_by else None
            })
        
        return data
    
    def to_summary(self):
        """Convert village to summary dictionary (minimal info)"""
        return {
            'id': str(self.id),
            'name': self.name,
            'code': self.code,
            'province': self.province,
            'district': self.district,
            'is_active': self.is_active,
            'total_properties': self.total_properties,
            'total_residents': self.total_residents
        }
    
    @classmethod
    def get_by_code(cls, code):
        """Get village by code"""
        return cls.query.filter_by(code=code, is_active=True).first()
    
    @classmethod
    def get_active_villages(cls):
        """Get all active villages"""
        return cls.query.filter_by(is_active=True).order_by(cls.name).all()
    
    @classmethod
    def search_villages(cls, query, province=None, district=None):
        """Search villages by name or code"""
        search = cls.query.filter(cls.is_active == True)
        
        if query:
            search = search.filter(
                db.or_(
                    cls.name.ilike(f'%{query}%'),
                    cls.code.ilike(f'%{query}%')
                )
            )
        
        if province:
            search = search.filter(cls.province == province)
        
        if district:
            search = search.filter(cls.district == district)
        
        return search.order_by(cls.name).all()
    
    def __repr__(self):
        return f'<Village {self.code}: {self.name}>'

# Event listeners for automatic timestamp updates
@event.listens_for(Village, 'before_update')
def update_village_timestamp(mapper, connection, target):
    target.updated_at = datetime.utcnow()

# Import UserVillage to avoid circular imports
from src.models.user_village import UserVillage
from src.models.user_model import User

