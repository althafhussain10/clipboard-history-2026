import { useState, useCallback } from "react";
import { Copy, Trash2, Search, ClipboardPaste, X, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ClipItem {
  id: string;
  text: string;
  timestamp: Date;
}

const ClipboardHistory = () => {
  const [items, setItems] = useState<ClipItem[]>(() => {
    try {
      const saved = localStorage.getItem("clipboard-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) }));
      }
    } catch {}
    return [];
  });
  const [search, setSearch] = useState("");

  // Persist to localStorage whenever items change
  const persistItems = (newItems: ClipItem[]) => {
    setItems(newItems);
    localStorage.setItem("clipboard-history", JSON.stringify(newItems));
  };
  const [inputText, setInputText] = useState("");

  const addItem = useCallback(() => {
    if (!inputText.trim()) return;
    const newItem: ClipItem = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
      timestamp: new Date(),
    };
    persistItems([newItem, ...items]);
    setInputText("");
    navigator.clipboard.writeText(inputText.trim()).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(() => {
      toast.success("Added to history!");
    });
  }, [inputText, items]);

  const copyItem = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      localStorage.setItem("clipboard-history", JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearAll = useCallback(() => {
    persistItems([]);
    toast.success("History cleared");
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setInputText(text.trim());
        toast.success("Pasted from clipboard!");
      }
    } catch {
      toast.error("Unable to read clipboard. Please paste manually.");
    }
  }, []);

  const filtered = items.filter((item) =>
    item.text.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <ClipboardPaste className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Clipboard History
            </h1>
            <p className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text to save..."
                className="bg-card border-border text-foreground placeholder:text-muted-foreground pr-10"
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <button
                onClick={pasteFromClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={addItem} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search + Clear */}
          {items.length > 0 && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search history..."
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button onClick={clearAll} variant="outline" size="sm" className="border-border text-destructive hover:bg-destructive/10 h-10">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            {filtered.length === 0 && items.length === 0 && (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <ClipboardPaste className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No clipboard history yet.
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Add text above to start saving.
                </p>
              </div>
            )}

            {filtered.length === 0 && items.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">
                No results found.
              </p>
            )}

            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground break-all whitespace-pre-wrap flex-1 leading-relaxed">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyItem(item.text)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Copy"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <p className="text-center text-xs text-muted-foreground">
          Developed by <span className="text-foreground font-medium">Mohamed Althaf Hussain</span>
        </p>
      </footer>
    </div>
  );
};

export default ClipboardHistory;
