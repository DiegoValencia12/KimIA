import json
import sys

import trafilatura

url = sys.argv[1] if len(sys.argv) > 1 else ""
html = sys.stdin.read()

if not html.strip():
    json.dump({"content": ""}, sys.stdout, ensure_ascii=False)
    sys.exit(0)

content = trafilatura.extract(
    html,
    url=url,
    output_format="markdown",
    include_comments=False,
    include_tables=True,
    include_links=True,
    include_formatting=True,
    favor_precision=True,
)

json.dump(
    {"content": content or ""},
    sys.stdout,
    ensure_ascii=False,
)
