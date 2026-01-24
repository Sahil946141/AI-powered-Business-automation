from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

def load_document(path: str) -> str:
    """
    Load text content from a PDF, DOCX, or TXT file.
    
    Args:
        path (str): Path to the file.
        
    Returns:
        str: Full text extracted from the document.
    """
    # Choose the right loader based on file type
    if path.endswith(".pdf"):
        loader = PyPDFLoader(path)
    elif path.endswith(".docx"):
        loader = Docx2txtLoader(path)
    elif path.endswith(".txt"):
        loader = TextLoader(path)
    else:
        raise ValueError("Unsupported file type")

    # Load the document
    docs = loader.load()

    # Combine all pages into a single string
    full_text = "\n".join([d.page_content for d in docs])

    return full_text
