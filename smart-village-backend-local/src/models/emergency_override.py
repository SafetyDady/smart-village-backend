"""
Emergency Override Model for Smart Village Management System
Handles emergency override functionality for Super Admins
"""

from src.models.user import db
from datetime import datetime, timedelta
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String
from sqlalchemy import event

class EmergencyOverride(db.Model):
    """Emergency Override model for tracking emergency access grants"""
    __tablename__ = 'emergency_overrides'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    target_resource = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.String(100))
    action = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    
    # Override Details
    original_permission = db.Column(db.String(100))
    override_granted = db.Column(db.Boolean, default=True)
    
    # Approval (for future use)
    requires_approval = db.Column(db.Boolean, default=False)
    approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45))  # IPv6 max length
    user_agent = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('src.models.user_model.User', foreign_keys=[user_id], backref='emergency_overrides')
    approver = db.relationship('src.models.user_model.User', foreign_keys=[approved_by], backref='approved_overrides')
    
    def __init__(self, **kwargs):
        super(EmergencyOverride, self).__init__(**kwargs)
        # Set default expiry to 1 hour if not provided
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(hours=1)
    
    @property
    def is_expired(self):
        """Check if override is expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if override is valid (active and not expired)"""
        return self.is_active and not self.is_expired
    
    @property
    def time_remaining(self):
        """Get remaining time in seconds"""
        if self.is_expired:
            return 0
        return int((self.expires_at - datetime.utcnow()).total_seconds())
    
    @property
    def duration_minutes(self):
        """Get total duration in minutes"""
        return int((self.expires_at - self.created_at).total_seconds() / 60)
    
    def extend_expiry(self, hours=1):
        """Extend the expiry time"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
    
    def revoke(self):
        """Revoke the emergency override"""
        self.is_active = False
    
    def approve(self, approver_id):
        """Approve the emergency override"""
        self.approved_by = approver_id
        self.approved_at = datetime.utcnow()
        self.requires_approval = False
    
    def matches_request(self, resource, target_id, action):
        """Check if this override matches a specific request"""
        return (
            self.target_resource == resource and
            (self.target_id is None or self.target_id == target_id) and
            self.action == action and
            self.is_valid
        )
    
    def to_dict(self, include_user=False, include_approver=False):
        """Convert override to dictionary"""
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'target_resource': self.target_resource,
            'target_id': self.target_id,
            'action': self.action,
            'reason': self.reason,
            
            # Override Details
            'original_permission': self.original_permission,
            'override_granted': self.override_granted,
            
            # Approval
            'requires_approval': self.requires_approval,
            'approved_by': str(self.approved_by) if self.approved_by else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            
            # Status
            'is_active': self.is_active,
            'is_expired': self.is_expired,
            'is_valid': self.is_valid,
            'expires_at': self.expires_at.isoformat(),
            'time_remaining': self.time_remaining,
            'duration_minutes': self.duration_minutes,
            
            # Audit
            'created_at': self.created_at.isoformat(),
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'user_agent': self.user_agent
        }
        
        # Include related objects if requested
        if include_user and self.user:
            data['user'] = {
                'id': str(self.user.id),
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.full_name
            }
        
        if include_approver and self.approver:
            data['approver'] = {
                'id': str(self.approver.id),
                'username': self.approver.username,
                'full_name': self.approver.full_name
            }
        
        return data
    
    @classmethod
    def create_override(cls, user_id, target_resource, action, reason, 
                       target_id=None, hours=1, ip_address=None, user_agent=None):
        """Create a new emergency override"""
        override = cls(
            user_id=user_id,
            target_resource=target_resource,
            target_id=target_id,
            action=action,
            reason=reason,
            expires_at=datetime.utcnow() + timedelta(hours=hours),
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(override)
        return override
    
    @classmethod
    def check_override(cls, user_id, resource, target_id, action):
        """Check if user has valid override for specific action"""
        override = cls.query.filter_by(
            user_id=user_id,
            target_resource=resource,
            action=action,
            is_active=True
        ).filter(
            cls.expires_at > datetime.utcnow()
        ).filter(
            db.or_(
                cls.target_id.is_(None),
                cls.target_id == target_id
            )
        ).first()
        
        return override
    
    @classmethod
    def get_active_overrides(cls, user_id=None):
        """Get all active (non-expired) overrides"""
        query = cls.query.filter(
            cls.is_active == True,
            cls.expires_at > datetime.utcnow()
        )
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def get_expired_overrides(cls, user_id=None):
        """Get all expired overrides"""
        query = cls.query.filter(
            db.or_(
                cls.is_active == False,
                cls.expires_at <= datetime.utcnow()
            )
        )
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def cleanup_expired(cls):
        """Clean up expired overrides (mark as inactive)"""
        expired_count = cls.query.filter(
            cls.is_active == True,
            cls.expires_at <= datetime.utcnow()
        ).update({'is_active': False})
        
        db.session.commit()
        return expired_count
    
    @classmethod
    def get_override_history(cls, user_id=None, resource=None, days=30):
        """Get override history"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = cls.query.filter(cls.created_at >= cutoff_date)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if resource:
            query = query.filter_by(target_resource=resource)
        
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def get_statistics(cls, days=30):
        """Get override usage statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total_overrides = cls.query.filter(cls.created_at >= cutoff_date).count()
        active_overrides = cls.query.filter(
            cls.created_at >= cutoff_date,
            cls.is_active == True,
            cls.expires_at > datetime.utcnow()
        ).count()
        
        # Group by resource
        resource_stats = db.session.query(
            cls.target_resource,
            db.func.count(cls.id).label('count')
        ).filter(
            cls.created_at >= cutoff_date
        ).group_by(cls.target_resource).all()
        
        # Group by user
        user_stats = db.session.query(
            cls.user_id,
            db.func.count(cls.id).label('count')
        ).filter(
            cls.created_at >= cutoff_date
        ).group_by(cls.user_id).all()
        
        return {
            'total_overrides': total_overrides,
            'active_overrides': active_overrides,
            'resource_breakdown': [{'resource': r[0], 'count': r[1]} for r in resource_stats],
            'user_breakdown': [{'user_id': str(u[0]), 'count': u[1]} for u in user_stats]
        }
    
    def __repr__(self):
        status = "Active" if self.is_valid else "Expired/Inactive"
        return f'<EmergencyOverride {self.target_resource}.{self.action} [{status}]>'

# Event listeners
@event.listens_for(EmergencyOverride, 'before_insert')
def log_override_creation(mapper, connection, target):
    """Log override creation for audit purposes"""
    # This could be extended to create audit log entries
    pass

@event.listens_for(EmergencyOverride, 'before_update')
def log_override_changes(mapper, connection, target):
    """Log override changes for audit purposes"""
    # This could be extended to create audit log entries
    pass

# Automatic cleanup task (would be called by a scheduler)
def cleanup_expired_overrides():
    """Cleanup function to be called periodically"""
    return EmergencyOverride.cleanup_expired()

