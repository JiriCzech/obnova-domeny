import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import urllib.parse
import webbrowser
import os

class BookmarkletMaker:
    def __init__(self, root):
        self.root = root
        self.root.title("Bookmarklet Maker")
        self.root.geometry("800x600")
        self.root.minsize(700, 500)
        
        self.setup_ui()
        
    def setup_ui(self):
        # Hlavní frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Konfigurace gridu
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        main_frame.rowconfigure(3, weight=1)
        main_frame.rowconfigure(5, weight=1)
        
        # Horní panel s tlačítky
        top_frame = ttk.Frame(main_frame)
        top_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(top_frame, text="Načíst ze souboru", command=self.load_from_file).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(top_frame, text="Otevřít online verzi", command=self.open_online_version).pack(side=tk.LEFT)
        
        # Label a textarea pro kód
        ttk.Label(main_frame, text="JavaScript kód:").grid(row=1, column=0, sticky=tk.W, pady=(0, 5))
        self.code_textarea = scrolledtext.ScrolledText(main_frame, width=80, height=15)
        self.code_textarea.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        self.code_textarea.insert(tk.END, "alert('hello world');")
        
        # Tlačítka pro generování
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=2, column=1, sticky=tk.W, pady=(0, 10))
        
        ttk.Button(button_frame, text="Generovat Bookmarklet", command=self.generate_bookmarklet).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Vyčistit", command=self.clear_code).pack(side=tk.LEFT)
        
        # Output
        ttk.Label(main_frame, text="Výstup:", font=("Arial", 10, "bold")).grid(row=3, column=0, sticky=tk.W, pady=(0, 5))
        
        output_frame = ttk.Frame(main_frame)
        output_frame.grid(row=3, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        self.output_textarea = scrolledtext.ScrolledText(output_frame, width=80, height=5)
        self.output_textarea.pack(fill=tk.BOTH, expand=True)
        
        # Tlačítko pro kopírování
        ttk.Button(output_frame, text="Kopírovat výstup", command=self.copy_output).pack(pady=(5, 0))
        
        # Konfigurace gridových vah
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        main_frame.rowconfigure(3, weight=1)
        
    def clean_code(self, code):
        return code.strip()
    
    def generate_bookmarklet(self):
        code = self.code_textarea.get(1.0, tk.END)
        
        cleaned_code = self.clean_code(code)
        if not cleaned_code:
            messagebox.showwarning("Upozornění", "Nejdříve vložte JavaScript kód.")
            return
        
        # Vytvoření bookmarkletu
        js_code = f"(function(){{{cleaned_code}}})();"
        encoded_js = urllib.parse.quote(js_code)
        bookmarklet = f"javascript:{encoded_js}"
        
        # Aktualizace UI
        self.output_textarea.delete(1.0, tk.END)
        self.output_textarea.insert(tk.END, bookmarklet)
    
    def clear_code(self):
        self.code_textarea.delete(1.0, tk.END)
        self.output_textarea.delete(1.0, tk.END)
    
    def copy_output(self):
        output = self.output_textarea.get(1.0, tk.END).strip()
        if output:
            self.root.clipboard_clear()
            self.root.clipboard_append(output)
            messagebox.showinfo("Info", "Výstup byl zkopírován do schránky.")
        else:
            messagebox.showwarning("Upozornění", "Nejdříve vygenerujte bookmarklet.")
    
    def load_from_file(self):
        file_path = filedialog.askopenfilename(
            title="Vyberte JavaScript soubor",
            filetypes=[("JavaScript files", "*.js"), ("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    self.code_textarea.delete(1.0, tk.END)
                    self.code_textarea.insert(tk.END, content)
            except Exception as e:
                messagebox.showerror("Chyba", f"Nelze načíst soubor: {str(e)}")
    
    def open_online_version(self):
        webbrowser.open("https://caiorss.github.io/bookmarklet-maker/")

if __name__ == "__main__":
    root = tk.Tk()
    app = BookmarkletMaker(root)
    root.mainloop()