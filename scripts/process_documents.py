import os
from pathlib import Path
from openai import OpenAI
from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SemanticSplitterNodeParser
from dotenv import load_dotenv
from convex import ConvexClient
import docx
import json
from typing import List, Dict, Any
import time
from datetime import datetime
from tqdm import tqdm

# Get the absolute path to the script's directory
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Load environment variables
env_path = PROJECT_ROOT / ".env"
if not env_path.exists():
    raise FileNotFoundError(f"Environment file not found at {env_path}")
load_dotenv(env_path)

# Check for required environment variables
required_env_vars = ["OPENAI_API_KEY", "NEXT_PUBLIC_CONVEX_URL"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Convex client
convex = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))

def read_docx(file_path: str) -> Dict[str, Any]:
    """Read a .docx file and return its content with metadata."""
    try:
        doc = docx.Document(file_path)
        content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # Extract metadata
        metadata = {
            "file_name": Path(file_path).name,
            "file_size": os.path.getsize(file_path),
            "last_modified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
            "total_paragraphs": len(doc.paragraphs),
            "total_characters": len(content)
        }
        
        return {
            "content": content,
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
        raise

def get_embedding(text: str) -> List[float]:
    """Get embedding for a text chunk using OpenAI API."""
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        raise

def process_resume():
    """Process the resume and store it in the database."""
    try:
        # Get the absolute path to the resume
        resume_path = PROJECT_ROOT / "data" / "EdaTopuz_Resume 2025.docx"
        print(f"Reading resume from: {resume_path}")
        
        if not resume_path.exists():
            raise FileNotFoundError(f"Resume file not found at {resume_path}")
        
        # Read the resume
        doc = docx.Document(str(resume_path))
        content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        if not content.strip():
            raise ValueError("Resume appears to be empty")
        
        print(f"Successfully read resume. Length: {len(content)} characters")
        
        # Get embedding for the full document
        print("Generating embedding for the document...")
        embedding = get_embedding(content)
        print("Successfully generated embedding")
        
        # Store the document with embedding
        print("Storing document in Convex...")
        document_id = convex.mutation("documents:store", {
            "name": resume_path.name,
            "content": content,
            "embedding": embedding
        })
        print(f"Stored document with ID: {document_id}")
        
        # Split into chunks
        chunks = split_into_semantic_chunks(content)
        print(f"Split resume into {len(chunks)} chunks")
        
        # Process each chunk
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)}")
            
            # Get embedding for the chunk
            embedding = get_embedding(chunk["content"])
            
            # Store the chunk
            print("Storing chunk in Convex...")
            result = convex.mutation("documents:store", {
                "name": f"resume_chunk_{i}",
                "content": chunk["content"],
                "embedding": embedding
            })
            
            print(f"Stored chunk {i+1} with ID: {result}")
            time.sleep(1)  # Add delay to avoid rate limits
        
        print("Successfully processed and stored all resume chunks!")
        
    except FileNotFoundError as e:
        print(f"File error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

def split_into_semantic_chunks(text: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
    """Split text into chunks of approximately equal size."""
    try:
        # Split text into paragraphs
        paragraphs = text.split('\n')
        chunks = []
        current_chunk = []
        current_size = 0
        chunk_index = 0
        
        for paragraph in paragraphs:
            # Skip empty paragraphs
            if not paragraph.strip():
                continue
                
            # If adding this paragraph would exceed chunk size, save current chunk
            if current_size + len(paragraph) > chunk_size and current_chunk:
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    "content": chunk_text,
                    "metadata": {
                        "chunk_index": chunk_index,
                        "chunk_size": len(chunk_text)
                    }
                })
                current_chunk = []
                current_size = 0
                chunk_index += 1
            
            # Add paragraph to current chunk
            current_chunk.append(paragraph)
            current_size += len(paragraph)
        
        # Don't forget the last chunk
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                "content": chunk_text,
                "metadata": {
                    "chunk_index": chunk_index,
                    "chunk_size": len(chunk_text)
                }
            })
        
        return chunks
    except Exception as e:
        print(f"Error splitting text: {str(e)}")
        raise

if __name__ == "__main__":
    process_resume()
    