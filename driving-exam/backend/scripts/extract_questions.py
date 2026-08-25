#!/usr/bin/env python3
"""
PDF Question Extractor for Driving Exam System
Extracts multiple-choice questions from PDF files for bulk import
"""

import re
import sys
import json
from typing import List, Dict, Optional

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
    import pdfplumber

CATEGORIES = ['road_signs', 'right_of_way', 'speed_limits', 'road_markings', 'general_rules', 'alcohol_safety']

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or "" + "\n"
    return text

def parse_questions(text: str) -> List[Dict]:
    """Parse extracted text into question objects."""
    questions = []
    
    # Pattern for questions with options (A, B, C, D)
    # Matches: Number. Question text A. Option A B. Option B C. Option C D. Option D
    pattern = r'(\d+)\.\s*(.+?)\s*A\.\s*(.+?)\s*B\.\s*(.+?)\s*C\.\s*(.+?)\s*D\.\s*(.+?)(?=\n\d+\.|\Z)'
    
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        q_num, question, a, b, c, d = match
        
        # Try to detect correct answer (common patterns)
        correct = 'a'  # default
        if re.search(r'(answer|correct|answer|r)\s*[:\-]?\s*[abcd]', question, re.IGNORECASE):
            ans_match = re.search(r'[abcd]', question[question.rfind('correct'):].lower() if 'correct' in question.lower() else '')
            if ans_match:
                correct = ans_match.group(0)
        
        # Clean up options and detect category
        category = 'general'
        for cat in CATEGORIES:
            if any(kw in question.lower() for kw in cat.split('_')):
                category = cat
                break
        
        questions.append({
            'question_rw': question.strip(),
            'question_en': '',
            'option_a_rw': a.strip(),
            'option_b_rw': b.strip(),
            'option_c_rw': c.strip(),
            'option_d_rw': d.strip(),
            'correct_answer': correct,
            'category': category,
            'language': 'rw'
        })
    
    return questions

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_questions.py <pdf_path> [output_json]")
        print("Example: python extract_questions.py questions.pdf questions.json")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        text = extract_text_from_pdf(pdf_path)
        questions = parse_questions(text)
        
        print(f"Extracted {len(questions)} questions from {pdf_path}")
        
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            print(f"Saved to {output_path}")
        else:
            print(json.dumps(questions, ensure_ascii=False, indent=2))
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()