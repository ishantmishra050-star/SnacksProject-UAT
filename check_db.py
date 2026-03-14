<<<<<<< HEAD
from backend.database import SessionLocal
from backend.models.product import Product

db = SessionLocal()
products = db.query(Product).all()
print(f"Total products: {len(products)}")
for p in products:
    print(f"- {p.name}: {p.image_url}")
db.close()
=======
from backend.database import SessionLocal
from backend.models.product import Product

db = SessionLocal()
products = db.query(Product).all()
print(f"Total products: {len(products)}")
for p in products:
    print(f"- {p.name}: {p.image_url}")
db.close()
>>>>>>> 5ade8d70e5c69900fe49d4f0fc7c9600620c5581
