# backend/generate_admin_hash.py
from getpass import getpass
from passlib.hash import argon2


def main():
    pwd = getpass("Introduce la contraseña del admin: ").strip()
    if not pwd:
        print("La contraseña no puede estar vacía.")
        return

    hash_ = argon2.hash(pwd)
    print("\nPon esto en tu .env como:")
    print("ADMIN_PASSWORD_HASH=" + hash_)
    print("\nEjemplo final de .env:")
    print("ADMIN_USER=admin")
    print("ADMIN_PASSWORD_HASH=" + hash_)


if __name__ == "__main__":
    main()
