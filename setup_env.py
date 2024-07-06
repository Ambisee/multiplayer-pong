def main():
    lines = []
    with open(".env", "r") as f:
        lines = f.readlines()

    with open("frontend/.env", "w") as f:
        f.writelines(lines)
    with open("backend/.env", "w") as f:
        f.writelines(lines)


if __name__ == "__main__":
    main()
