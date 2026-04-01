from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from app.db.models import UserCreate, UserLogin, UserResponse, User, Token
from app.db.mongodb import get_database
from app.core.jwt import get_password_hash, verify_password, create_access_token, verify_token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")
    
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    db = get_database()
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        organization=user_data.organization or "DefaultOrg"
    )
    user_dict = new_user.dict()
    await db["users"].insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    db = get_database()
    user = await db["users"].find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        organization=current_user.get("organization", "DefaultOrg"),
        preferences=current_user["preferences"]
    )

@router.get("/search")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    """Search for users by email (for overlap finder). Returns up to 5 matches."""
    if len(q) < 3:
        return []
    db = get_database()
    cursor = db["users"].find(
        {"email": {"$regex": q, "$options": "i"}, "_id": {"$ne": current_user["_id"]}},
        {"_id": 1, "name": 1, "email": 1}
    ).limit(5)
    users = await cursor.to_list(length=5)
    return [{"id": str(u["_id"]), "name": u["name"], "email": u["email"], "organization": u.get("organization", "")} for u in users]
