from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Complaint, Department, User


def get_all_users(db: Session) -> list[User]:
    return db.query(User).all()


def promote_user(db: Session, user_id: int, department_id: int | None = None) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    if user.role == "SUPER_ADMIN":
        raise ValueError("Cannot modify SUPER_ADMIN")

    target_department_id = department_id if department_id is not None else user.department_id
    if not target_department_id:
        raise ValueError("Department is required to promote a user")

    department = db.query(Department).filter(Department.id == target_department_id).first()
    if not department:
        raise ValueError("Department not found")

    user.role = "DEPARTMENT_ADMIN"
    user.department_id = target_department_id
    db.commit()
    db.refresh(user)
    return user


def demote_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    if user.role == "SUPER_ADMIN":
        raise ValueError("Cannot demote SUPER_ADMIN")
    user.role = "USER"
    user.department_id = None
    db.commit()
    db.refresh(user)
    return user


def assign_user_department(db: Session, user_id: int, department_id: int | None) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    if user.role == "SUPER_ADMIN":
        raise ValueError("Cannot modify SUPER_ADMIN")

    if department_id is None:
        if user.role == "DEPARTMENT_ADMIN":
            raise ValueError("Department admins must stay assigned to a department")
        user.department_id = None
    else:
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise ValueError("Department not found")
        user.department_id = department_id

    db.commit()
    db.refresh(user)
    return user


def update_department(
    db: Session, department_id: int, name: str | None, description: str | None
) -> Department:
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise ValueError("Department not found")

    if name is not None:
        cleaned = name.strip()
        if not cleaned:
            raise ValueError("Department name is required")
        existing = (
            db.query(Department)
            .filter(Department.name == cleaned, Department.id != department_id)
            .first()
        )
        if existing:
            raise ValueError("Department name already exists")
        department.name = cleaned

    if description is not None:
        department.description = description

    db.commit()
    db.refresh(department)
    return department


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    if user.role == "SUPER_ADMIN":
        raise ValueError("Cannot delete SUPER_ADMIN")
    db.delete(user)
    db.commit()


def get_all_departments(db: Session) -> list[Department]:
    return db.query(Department).all()


def create_department(db: Session, name: str, description: str | None) -> Department:
    department = Department(name=name, description=description)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


def delete_department(db: Session, department_id: int):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise ValueError("Department not found")

    assigned = db.query(User).filter(User.department_id == department_id).first()
    if assigned:
        raise ValueError("Department has assigned admins")

    complaints = db.query(Complaint).filter(Complaint.department_id == department_id).first()
    if complaints:
        raise ValueError("Department has complaints")

    db.delete(department)
    db.commit()


def create_department_admin(
    db: Session, name: str, email: str, password: str, department_id: int
) -> User:
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already registered")

    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise ValueError("Department not found")

    user = User(
        name=name,
        email=email,
        password=hash_password(password),
        role="DEPARTMENT_ADMIN",
        department_id=department_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_all_complaints(db: Session) -> list[Complaint]:
    return db.query(Complaint).all()


def delete_complaint(db: Session, complaint_id: int):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise ValueError("Complaint not found")
    db.delete(complaint)
    db.commit()
