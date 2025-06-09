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

def process_documents():
    """Process all documents and store them in the database."""
    try:
        # Get the absolute paths to the documents
        documents_dir = PROJECT_ROOT / "data"
        resume_path = documents_dir / "EdaTopuz_Resume 2025.docx"
        suggested_answers_path = documents_dir / "suggested_answers.docx"
        
        print(f"\nDebug: Starting document processing")
        print(f"Debug: Looking for resume at {resume_path}")
        print(f"Debug: Looking for suggested answers at {suggested_answers_path}")
        
        # Process resume
        print(f"Processing resume from: {resume_path}")
        if not resume_path.exists():
            raise FileNotFoundError(f"Resume file not found at {resume_path}")
        
        resume_content = read_docx(str(resume_path))["content"]
        if not resume_content.strip():
            raise ValueError("Resume appears to be empty")
        
        print(f"Successfully read resume. Length: {len(resume_content)} characters")
        print(f"Debug: First 100 characters of resume: {resume_content[:100]}...")
        
        # Get embedding for the resume
        print("Generating embedding for the resume...")
        resume_embedding = get_embedding(resume_content)
        print(f"Successfully generated resume embedding. Length: {len(resume_embedding)}")
        print(f"Debug: First 5 values of embedding: {resume_embedding[:5]}")
        
        # Store the resume
        print("Storing resume in Convex...")
        print(f"Debug: Attempting to store with name: resume")
        print(f"Debug: Content length: {len(resume_content)}")
        print(f"Debug: Embedding length: {len(resume_embedding)}")
        
        resume_id = convex.mutation("documents:store", {
            "name": "resume",
            "content": resume_content,
            "embedding": resume_embedding
        })
        print(f"Stored resume with ID: {resume_id}")
        
        # Split resume into chunks
        resume_chunks = split_into_semantic_chunks(resume_content)
        print(f"Split resume into {len(resume_chunks)} chunks")
        
        # Process resume chunks
        for i, chunk in enumerate(resume_chunks):
            print(f"Processing resume chunk {i+1}/{len(resume_chunks)}")
            
            # Get embedding for the chunk
            embedding = get_embedding(chunk["content"])
            
            # Store the chunk
            print("Storing resume chunk in Convex...")
            result = convex.mutation("documents:store", {
                "name": f"resume_chunk_{i}",
                "content": chunk["content"],
                "embedding": embedding
            })
            
            print(f"Stored resume chunk {i+1} with ID: {result}")
            time.sleep(1)  # Add delay to avoid rate limits
        
        # Process suggested answers
        print(f"Processing suggested answers from: {suggested_answers_path}")
        if not suggested_answers_path.exists():
            raise FileNotFoundError(f"Suggested answers file not found at {suggested_answers_path}")
        
        suggested_answers_content = read_docx(str(suggested_answers_path))["content"]
        if not suggested_answers_content.strip():
            raise ValueError("Suggested answers file appears to be empty")
        
        print(f"Successfully read suggested answers. Length: {len(suggested_answers_content)} characters")
        
        # Get embedding for suggested answers
        print("Generating embedding for suggested answers...")
        answers_embedding = get_embedding(suggested_answers_content)
        print("Successfully generated suggested answers embedding")
        
        # Store the suggested answers
        print("Storing suggested answers in Convex...")
        answers_id = convex.mutation("documents:store", {
            "name": "suggested_answers",
            "content": suggested_answers_content,
            "embedding": answers_embedding
        })
        print(f"Stored suggested answers with ID: {answers_id}")
        
        # Split suggested answers into chunks
        answers_chunks = split_into_semantic_chunks(suggested_answers_content)
        print(f"Split suggested answers into {len(answers_chunks)} chunks")
        
        # Process suggested answers chunks
        for i, chunk in enumerate(answers_chunks):
            print(f"Processing suggested answers chunk {i+1}/{len(answers_chunks)}")
            
            # Get embedding for the chunk
            embedding = get_embedding(chunk["content"])
            
            # Store the chunk
            print("Storing suggested answers chunk in Convex...")
            result = convex.mutation("documents:store", {
                "name": f"suggested_answers_chunk_{i}",
                "content": chunk["content"],
                "embedding": embedding
            })
            
            print(f"Stored suggested answers chunk {i+1} with ID: {result}")
            time.sleep(1)  # Add delay to avoid rate limits
        
        print("Successfully processed and stored all documents and chunks!")
        
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
    process_documents()
    