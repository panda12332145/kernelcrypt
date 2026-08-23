import fitz
import os
import re
from bs4 import BeautifulSoup


PDF_FILE = "input.pdf"
OUTPUT_DIR = "output"
PAGES_DIR = os.path.join(OUTPUT_DIR, "pages")
OUTPUT_HTML = os.path.join(OUTPUT_DIR, "book.html")


os.makedirs(PAGES_DIR, exist_ok=True)


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================


def clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()



def is_title(text: str) -> bool:
    """
    Heurística simples para detectar títulos.
    """

    if len(text) < 4:
        return False

    if len(text) > 120:
        return False

    if text.isupper():
        return True

    if re.match(r"^(chapter|cap[ií]tulo)\s+\d+", text.lower()):
        return True

    return False



def create_html_document(title="Document"):
    soup = BeautifulSoup("", "html.parser")

    html = soup.new_tag("html")
    head = soup.new_tag("head")
    body = soup.new_tag("body")

    meta = soup.new_tag("meta", charset="utf-8")
    head.append(meta)

    title_tag = soup.new_tag("title")
    title_tag.string = title
    head.append(title_tag)

    style = soup.new_tag("style")
    style.string = """
    body {
        font-family: Arial, sans-serif;
        max-width: 900px;
        margin: auto;
        padding: 40px;
        line-height: 1.7;
        background: #f5f5f5;
        color: #222;
    }

    .page {
        background: white;
        padding: 50px;
        margin-bottom: 50px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .page-number {
        color: gray;
        margin-bottom: 20px;
        font-size: 14px;
    }

    h1 {
        margin-top: 40px;
        font-size: 2rem;
    }

    p {
        margin-bottom: 18px;
        text-align: justify;
    }
    """

    head.append(style)

    html.append(head)
    html.append(body)

    soup.append(html)

    return soup


# =========================================================
# ABRIR PDF
# =========================================================


doc = fitz.open(PDF_FILE)

soup = create_html_document(title="Converted Book")
body = soup.body


# =========================================================
# PROCESSAMENTO DAS PÁGINAS
# =========================================================


for page_index in range(len(doc)):

    page = doc[page_index]

    blocks = page.get_text("blocks")

    page_div = soup.new_tag("div", attrs={"class": "page"})

    page_number = soup.new_tag(
        "div",
        attrs={"class": "page-number"}
    )

    page_number.string = f"Page {page_index + 1}"

    page_div.append(page_number)


    # =====================================================
    # EXTRAIR BLOCOS
    # =====================================================

    for block in blocks:

        text = block[4]

        text = clean_text(text)

        if not text:
            continue


        # =================================================
        # DETECÇÃO DE TÍTULO
        # =================================================

        if is_title(text):
            h1 = soup.new_tag("h1")
            h1.string = text
            page_div.append(h1)

        else:
            p = soup.new_tag("p")
            p.string = text
            page_div.append(p)


    body.append(page_div)


    # =====================================================
    # SALVAR PÁGINA INDIVIDUAL
    # =====================================================

    single_page_soup = create_html_document(
        title=f"Page {page_index + 1}"
    )

    single_page_soup.body.append(page_div)

    page_file = os.path.join(
        PAGES_DIR,
        f"page_{page_index + 1}.html"
    )

    with open(page_file, "w", encoding="utf-8") as f:
        f.write(single_page_soup.prettify())


# =========================================================
# SALVAR HTML COMPLETO
# =========================================================


with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(soup.prettify())


print("[+] Conversão concluída")
print(f"[+] HTML salvo em: {OUTPUT_HTML}")
print(f"[+] Páginas salvas em: {PAGES_DIR}")
