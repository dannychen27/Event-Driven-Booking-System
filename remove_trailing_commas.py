#!/usr/bin/env python3

import re
import sys
from pathlib import Path


def remove_trailing_commas(file_path: str) -> None:
    path = Path(file_path)
    content = path.read_text(encoding="utf-8")

    # Remove commas immediately before a closing delimiter.
    updated_content = re.sub(r",(\s*[)\]}])", r"\1", content)

    path.write_text(updated_content, encoding="utf-8")
    print(f"Removed trailing commas from {path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python3 {sys.argv[0]} <file>")
        sys.exit(1)

    remove_trailing_commas(sys.argv[1])