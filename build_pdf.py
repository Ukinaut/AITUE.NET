import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AITUE COMUNICA S.A. — Documentación Técnica de Plataforma & IA")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 50, 558, 50)
        
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "AITUE COMUNICA S.A. © 2026 — Documento Oficial de Desarrollo")
        self.restoreState()

def build_aitue_pdf():
    pdf_filename = "Documentacion_Tecnica_AITUE_COMUNICA.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=64
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0f172a") # Slate 900
    c_cyan = colors.HexColor("#0284c7")    # Sky 600
    c_dark_cyan = colors.HexColor("#0369a1")
    c_text = colors.HexColor("#334155")    # Slate 700
    c_bg_code = colors.HexColor("#f8fafc") # Slate 50
    c_border_code = colors.HexColor("#e2e8f0")

    # Custom Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=6
    )

    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_dark_cyan,
        spaceAfter=12
    )

    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_dark_cyan,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_text,
        spaceAfter=5
    )

    style_list = ParagraphStyle(
        'List_Custom',
        parent=style_body,
        leftIndent=10,
        spaceAfter=3
    )

    style_code = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=c_bg_code,
        borderColor=c_border_code,
        borderWidth=1,
        borderPadding=5,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("AITUE COMUNICA S.A.", ParagraphStyle('SubHeader', fontName='Helvetica-Bold', fontSize=10, textColor=c_cyan, spaceAfter=2)))
    story.append(Paragraph("Documentación Técnica & Funcional de Plataforma Web e IA", style_title))
    story.append(Paragraph("Resumen de procesos implementados, arquitectura, funciones, animaciones y servidor de WhatsApp", style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_cyan, spaceBefore=0, spaceAfter=12))

    md_path = os.path.join(r"C:\Users\Ukina\.gemini\antigravity-ide\brain\0b64ccb1-5c3e-41b5-9095-8941a5b69085", "documentacion_tecnica_aitue.md")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    lines = md_text.split('\n')
    in_code_block = False
    code_lines = []

    for line in lines:
        line_str = line.strip()
        
        if line_str.startswith('```'):
            if in_code_block:
                # End code block
                code_text = "<br/>".join(code_lines).replace(" ", "&nbsp;")
                story.append(Paragraph(code_text, style_code))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            # Escape HTML in code block
            clean_code = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            code_lines.append(clean_code)
            continue

        if not line_str:
            continue

        # Headers
        if line_str.startswith('# '):
            clean_h = line_str[2:].replace('**', '').strip()
            story.append(Paragraph(clean_h, style_h1))
        elif line_str.startswith('## '):
            clean_h = line_str[3:].replace('**', '').strip()
            story.append(Paragraph(clean_h, style_h1))
        elif line_str.startswith('### '):
            clean_h = line_str[4:].replace('**', '').strip()
            story.append(Paragraph(clean_h, style_h2))
        elif line_str.startswith('|') and '|' in line_str[1:]:
            # Simple table formatting
            parts = [p.strip() for p in line_str.split('|')[1:-1]]
            if len(parts) >= 2 and not ('---' in parts[0] or ':---' in parts[0]):
                col1 = Paragraph(re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', parts[0]), style_body)
                col2 = Paragraph(re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', parts[1]), style_body)
                col3 = Paragraph(re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', parts[2]) if len(parts) > 2 else "", style_body)
                
                t_data = [[col1, col2, col3]] if len(parts) > 2 else [[col1, col2]]
                t_widths = [100, 130, 274] if len(parts) > 2 else [140, 364]
                
                t = Table(t_data, colWidths=t_widths)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
                    ('TEXTCOLOR', (0,0), (-1,-1), c_text),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                ]))
                story.append(t)
                story.append(Spacer(1, 3))
        elif line_str.startswith('* ') or line_str.startswith('- '):
            formatted_bullet = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_str[2:])
            formatted_bullet = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', formatted_bullet)
            story.append(Paragraph(f"• {formatted_bullet}", style_list))
        elif line_str.startswith('1. ') or line_str.startswith('2. ') or line_str.startswith('3. ') or line_str.startswith('4. ') or line_str.startswith('5. '):
            formatted_item = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_str)
            formatted_item = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', formatted_item)
            story.append(Paragraph(formatted_item, style_list))
        else:
            formatted_p = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_str)
            formatted_p = re.sub(r'`(.*?)`', r'<font name="Courier">\1</font>', formatted_p)
            story.append(Paragraph(formatted_p, style_body))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Documento PDF creado con exito: {pdf_filename}")

if __name__ == "__main__":
    build_aitue_pdf()
