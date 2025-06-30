from datetime import datetime
from src.models.user import db

class PropertyType(db.Model):
    """Property Type model for managing property categories"""
    __tablename__ = 'property_types'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship with properties
    properties = db.relationship('Property', backref='property_type', lazy=True)
    
    def __init__(self, name, description=None, is_active=True):
        self.name = name
        self.description = description
        self.is_active = is_active
    
    def to_dict(self):
        """Convert PropertyType to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'property_count': len(self.properties) if self.properties else 0
        }
    
    def update(self, **kwargs):
        """Update PropertyType attributes"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_active_types(cls):
        """Get all active property types"""
        return cls.query.filter_by(is_active=True).order_by(cls.name).all()
    
    @classmethod
    def get_by_name(cls, name):
        """Get property type by name"""
        return cls.query.filter_by(name=name).first()
    
    def __repr__(self):
        return f'<PropertyType {self.name}>'

