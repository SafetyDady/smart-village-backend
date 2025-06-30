from datetime import datetime
from src.models.user import db

class Property(db.Model):
    """Property model for managing village properties"""
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    address = db.Column(db.Text, nullable=False)
    property_type_id = db.Column(db.Integer, db.ForeignKey('property_types.id'), nullable=False)
    property_status_id = db.Column(db.Integer, db.ForeignKey('property_statuses.id'), nullable=False)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Integer)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __init__(self, address, property_type_id, property_status_id, bedrooms=None, bathrooms=None, description=None):
        self.address = address
        self.property_type_id = property_type_id
        self.property_status_id = property_status_id
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.description = description
    
    def to_dict(self):
        """Convert Property to dictionary"""
        return {
            'id': self.id,
            'address': self.address,
            'property_type_id': self.property_type_id,
            'property_type': self.property_type.to_dict() if self.property_type else None,
            'property_status_id': self.property_status_id,
            'property_status': self.property_status.to_dict() if self.property_status else None,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_dict_simple(self):
        """Convert Property to simple dictionary (without nested objects)"""
        return {
            'id': self.id,
            'address': self.address,
            'property_type_id': self.property_type_id,
            'property_type_name': self.property_type.name if self.property_type else None,
            'property_status_id': self.property_status_id,
            'property_status_name': self.property_status.name if self.property_status else None,
            'property_status_color': self.property_status.color if self.property_status else None,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update(self, **kwargs):
        """Update Property attributes"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_by_status(cls, status_id):
        """Get properties by status"""
        return cls.query.filter_by(property_status_id=status_id).all()
    
    @classmethod
    def get_by_type(cls, type_id):
        """Get properties by type"""
        return cls.query.filter_by(property_type_id=type_id).all()
    
    @classmethod
    def search_by_address(cls, search_term):
        """Search properties by address"""
        return cls.query.filter(cls.address.contains(search_term)).all()
    
    @classmethod
    def get_statistics(cls):
        """Get property statistics"""
        from sqlalchemy import func
        from src.models.property_status_model import PropertyStatus
        
        # Get total count
        total_count = cls.query.count()
        
        # Get count by status
        status_counts = db.session.query(
            PropertyStatus.name,
            PropertyStatus.color,
            func.count(cls.id).label('count')
        ).outerjoin(cls, PropertyStatus.id == cls.property_status_id)\
         .group_by(PropertyStatus.id, PropertyStatus.name, PropertyStatus.color)\
         .all()
        
        return {
            'total': total_count,
            'by_status': [
                {
                    'status': status.name,
                    'color': status.color,
                    'count': status.count
                }
                for status in status_counts
            ]
        }
    
    def __repr__(self):
        return f'<Property {self.address}>'

