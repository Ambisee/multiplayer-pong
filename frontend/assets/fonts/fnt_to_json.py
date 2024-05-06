import json


def process_line(line: str, d: dict):
    line_arr = line.split()
    if line_arr[0] != "char":
        return

    _, value = line_arr[1].split("=")

    # value is an ASCII value in decimal
    key = chr(int(value))

    d["glyphs"][key] = {}

    for token in line_arr[2:]:
        param, value = token.split("=")
        d["glyphs"][key][param] = int(value)


def populate_metadata(lines: list, d: dict):
    for line in lines[0].split():
        if "=" not in line:
            continue

        param, value = line.split("=")
        if param == "size":
            d[param] = int(value)
            break

    for line in lines[1].split():
        if "=" not in line:
            continue

        param, value = line.split("=")
        if param == "lineHeight":
            d[param] = int(value)
            break

    for line in lines[3].split():
        if "=" not in line:
            continue

        param, value = line.split("=")
        if param == "count":
            d[param] = int(value)
            break


def main():
    result_filename = "Space_mono.json"
    result = {"glyphs": {}}

    with open("Space_mono.fnt", "r") as f:
        lines = f.readlines()

        populate_metadata(lines, result)
        for line in lines[4:]:
            if line.startswith("kerning"):
                break
        
            process_line(line, result)

    with open(result_filename, "w") as f:
        json.dump(result, f)

main()