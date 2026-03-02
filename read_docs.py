import docx
import os

def read_docx(file_path):
    try:
        doc = docx.Document(file_path)
        fullText = []
        for para in doc.paragraphs:
            fullText.append(para.text)
        return '\n'.join(fullText)
    except Exception as e:
        return str(e)

files = ['ResQLink_Backend_Guide_Gemini.docx', 'ResQLink_PRD.docx', 'Disaster Management App Blueprint.docx']
with open('extracted_docs.txt', 'w', encoding='utf-8') as f:
    for file in files:
        if os.path.exists(file):
            f.write(f"--- {file} ---\n")
            f.write(read_docx(file))
            f.write("\n" + "="*50 + "\n\n")
