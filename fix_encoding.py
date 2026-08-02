
with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Map mojibake sequences to correct UTF-8 chars
fixes = [
    ('Ã³', 'ó'),
    ('Ã©', 'é'),
    ('Ã¡', 'á'),
    ('Ã­', 'í'),
    ('Ãº', 'ú'),
    ('Ã±', 'ñ'),
    ('Ã"', 'Ó'),
    ('Ã‰', 'É'),
    ('Ã–', 'Ö'),
    ('Ã¨', 'è'),
    ('Â°', '°'),
    ('Â©', '©'),
    ('Â»', '»'),
    ('Â«', '«'),
    ('Â·', '·'),
    ('Â¡', '¡'),
    ('Â¿', '¿'),
    ('â€"', '\u2013'),
    ('â€˜', '\u2018'),
    ('â€™', '\u2019'),
    ('â€œ', '\u201c'),
    ('â€', '\u201d'),
]

for old, new in fixes:
    c = c.replace(old, new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Encoding fixed successfully')
