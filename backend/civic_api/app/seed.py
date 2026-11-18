from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Department, User

DEPARTMENTS = [
    ("Public Works Department", "Roads, bridges, and public infrastructure"),
    ("Sanitation Department", "Waste management and cleanliness"),
    ("Electricity Board", "Power and street lighting"),
    ("Water Supply Department", "Water, drainage, and sewage"),
    ("General Municipal Department", "General civic issues"),
]

# One DEPARTMENT_ADMIN per existing department (email = login username)
DEPT_ADMIN_ACCOUNTS = {
    "Public Works Department": {
        "name": "Public Works Admin",
        "email": "publicworks@civic.gov",
        "password": "admin123",
    },
    "Sanitation Department": {
        "name": "Sanitation Admin",
        "email": "sanitation@civic.gov",
        "password": "admin123",
    },
    "Electricity Board": {
        "name": "Electricity Admin",
        "email": "electricity@civic.gov",
        "password": "admin123",
    },
    "Water Supply Department": {
        "name": "Water Supply Admin",
        "email": "water@civic.gov",
        "password": "admin123",
    },
    "General Municipal Department": {
        "name": "General Municipal Admin",
        "email": "general@civic.gov",
        "password": "admin123",
    },
}


def _ensure_dept_admin(db: Session, department: Department, name: str, email: str, password: str) -> None:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        # Keep credentials; re-link department/role if needed
        existing.role = "DEPARTMENT_ADMIN"
        existing.department_id = department.id
        if not existing.name:
            existing.name = name
        return

    db.add(
        User(
            name=name,
            email=email,
            password=hash_password(password),
            role="DEPARTMENT_ADMIN",
            department_id=department.id,
        )
    )


def seed_database(db: Session):
    for name, description in DEPARTMENTS:
        if not db.query(Department).filter(Department.name == name).first():
            db.add(Department(name=name, description=description))
    db.flush()

    if not db.query(User).filter(User.email == "admin@civic.gov").first():
        db.add(
            User(
                name="Super Admin",
                email="admin@civic.gov",
                password=hash_password("admin123"),
                role="SUPER_ADMIN",
            )
        )

    # Demo citizen for testing the user portal
    if not db.query(User).filter(User.email == "citizen@civic.gov").first():
        db.add(
            User(
                name="Demo Citizen",
                email="citizen@civic.gov",
                password=hash_password("admin123"),
                role="USER",
            )
        )

    # Admins for every department already in the system
    for department in db.query(Department).all():
        account = DEPT_ADMIN_ACCOUNTS.get(department.name)
        if account:
            _ensure_dept_admin(
                db,
                department,
                account["name"],
                account["email"],
                account["password"],
            )
        else:
            # Fallback for any extra department Super Admin may have added
            slug = (
                department.name.lower()
                .replace("department", "")
                .replace("board", "")
                .strip()
                .replace(" ", "")
            )
            email = f"{slug or f'dept{department.id}'}@civic.gov"
            _ensure_dept_admin(
                db,
                department,
                f"{department.name} Admin",
                email,
                "admin123",
            )

    # Legacy demo login (Sanitation) — keep working if already used
    sanitation = db.query(Department).filter(Department.name == "Sanitation Department").first()
    if sanitation:
        _ensure_dept_admin(
            db,
            sanitation,
            "Department Admin",
            "deptadmin@civic.gov",
            "admin123",
        )

    db.commit()
