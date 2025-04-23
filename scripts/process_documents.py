import os
from tqdm import tqdm
from llama_index.core import (
    SimpleDirectoryReader,
    OpenAIEmbedding,
    Document,
    VectorStoreIndex
)
from llama_hub.file.llama_parse import LlamaParse
from convex import ConvexClient
from dotenv import load_dotenv
import nest_asyncio
from collections import defaultdict
from llama_index.core.node_parser import SemanticSplitterNodeParser

def process_documents():
    # Load environment variables
    load_dotenv()
    
    # Set up Convex connection
    client = ConvexClient('https://resolute-donkey-193.convex.cloud')  # Your Convex URL
    
    # Initialize async support
    nest_asyncio.apply()

    # Set up document parser with LlamaParse
    parser = LlamaParse(
        api_key=os.getenv('LLAMA_CLOUD_API_KEY'),
        result_type="markdown",
        verbose=True
    )
    
    print("Loading documents from data directory...")
    # Load documents from data directory
    document_loader = SimpleDirectoryReader(
        "./data",
        file_extractor={
            ".pdf": parser,
            ".docx": parser,
            ".doc": parser
        }
    )
    documents = document_loader.load_data()

    print("Processing and merging documents...")
    # Process documents by filename
    doc_groups = defaultdict(list)
    for doc in documents:
        filename = doc.metadata.get("file_name")
        doc_groups[filename].append(doc)

    # Merge document contents
    processed_docs = []
    for filename, docs in doc_groups.items():
        # Combine document contents
        full_text = "\n\n".join([doc.text for doc in docs])
        # Keep metadata from first document
        doc_metadata = docs[0].metadata
        # Create merged document
        processed_doc = Document(text=full_text, metadata=doc_metadata)
        processed_docs.append(processed_doc)

    print("Setting up embedding model and text processing...")
    # Initialize embedding model
    embedder = OpenAIEmbedding(model="text-embedding-3-small")
    
    # Set up advanced text splitting
    text_processor = SemanticSplitterNodeParser(
        buffer_size=1,
        breakpoint_percentile_threshold=95,
        embed_model=embedder
    )

    print("Storing documents and generating embeddings...")
    # Process each document
    for doc in tqdm(processed_docs, desc="Processing documents"):
        # Prepare document info
        doc_info = {
            'title': doc.metadata.get("file_name"),
            'text': str(doc.text),
            'lastModifiedDate': doc.metadata.get("last_modified_date")
        }

        # Save document to Convex
        doc_id = client.mutation("documents:store", doc_info)
        print(f"Stored document: {doc_info['title']}")

        # Process document into chunks
        chunks = text_processor.get_nodes_from_documents([doc])
        
        print(f"Processing chunks for {doc_info['title']}...")
        # Process each chunk
        for chunk in chunks:
            chunk_text = chunk.get_content()
            chunk_embedding = embedder.get_text_embedding(chunk_text)
            
            # Store chunk data
            chunk_info = {
                'documentId': doc_id,
                'text': chunk_text,
                'embedding': chunk_embedding
            }
            
            chunk_id = client.mutation("chunks:store", chunk_info)
            print(f"Stored chunk with ID: {chunk_id}")

if __name__ == "__main__":
    print("Starting document processing...")
    try:
        process_documents()
        print("Document processing completed successfully!")
    except Exception as e:
        print(f"Error during processing: {str(e)}")  

