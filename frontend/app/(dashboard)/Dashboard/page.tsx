"use client"
import { useState, useRef } from "react"
import AnswerGrid from "../Answer/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Upload, Zap, Search, BarChart3, Database, Files, X, FolderOpen } from "lucide-react"

const operationsList = [
  { id: "Summarization", label: "Summarization", icon: "📄" },
  { id: "Translation", label: "Translation", icon: "🌐" },
  { id: "Keyword Extraction", label: "Keyword Extraction", icon: "🔑" },
  { id: "Sentiment Analysis", label: "Sentiment Analysis", icon: "❤️" },
  { id: "Grammar Correction", label: "Grammar Correction", icon: "✅" },
  { id: "Spell Check", label: "Spell Check", icon: "A" },
  { id: "Remove Stop Words", label: "Remove Stop Words", icon: "⏳" },
  { id: "Convert Case", label: "Convert Case", icon: "T" },
]

export default function DashboardPage() {
  const [inputText, setInputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => f.name.endsWith('.csv'));
    setSelectedFiles(fileArray);
    let rowsCount = 0;
    const readFile = (file: File, isFirst: boolean) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          let content = (ev.target?.result as string).trim();
          const lines = content.split(/\r?\n/);
          rowsCount += lines.length - 1; 
          if (!isFirst) content = lines.slice(1).join("\n");
          else content = lines.join("\n");
          resolve(content);
        };
        reader.readAsText(file);
      });
    };
    const contents = await Promise.all(fileArray.map((f, i) => readFile(f, i === 0)));
    setInputText(contents.join("\n"));
    setTotalRows(rowsCount);
  };

  const handleRunAll = async () => {
    if (!inputText || selectedOps.length === 0) return alert("Select operations and upload data.");
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, operations: selectedOps, email: localStorage.getItem("userEmail") || "Guest", filename: selectedFiles.length > 1 ? `Bulk_${selectedFiles.length}_files.csv` : selectedFiles[0]?.name }),
      });
      const data = await res.json();
      setResults(data.results); setStats(data.stats);
      alert("Analysis complete! Details archived in Inbox.");
    } catch (e) { alert("Backend Error"); }
    setIsLoading(false);
  };

  const handleSearch = async () => {
      if(!searchQuery.trim()) return;
      const res = await fetch(`http://127.0.0.1:5001/api/search?q=${searchQuery}`);
      setSearchResults(await res.json());
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto transition-colors duration-300">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          <Card className="p-4 border-l-4 border-blue-500 bg-white dark:bg-zinc-900 shadow-sm transition-colors">
            <Zap className="text-blue-500 mb-1" size={18} />
            <p className="text-[10px] text-gray-400 uppercase font-bold">Data Segments</p>
            <p className="text-2xl font-bold dark:text-white">{stats.total_chunks}</p>
          </Card>
          <Card className="p-4 border-l-4 border-green-500 bg-white dark:bg-zinc-900 shadow-sm transition-colors">
            <BarChart3 className="text-green-500 mb-1" size={18} />
            <p className="text-[10px] text-gray-400 uppercase font-bold">Execution Velocity</p>
            <p className="text-2xl font-bold dark:text-white">{stats.processing_time.toFixed(4)}s</p>
          </Card>
          <Card className="p-4 border-l-4 border-red-500 bg-white dark:bg-zinc-900 shadow-sm transition-colors">
            <CheckCircle2 className="text-red-500 mb-1" size={18} />
            <p className="text-[10px] text-gray-400 uppercase font-bold">System Status</p>
            <p className="text-2xl font-bold dark:text-white">{stats.alert ? "🚨 ATTENTION" : "✅ STABLE"}</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-8 border-2 border-dashed border-blue-200 dark:border-zinc-800 hover:border-blue-500 transition-all cursor-pointer rounded-3xl flex flex-col items-center justify-center bg-gray-50/30 dark:bg-zinc-900/30" onClick={() => fileInputRef.current?.click()}>
            <input type="file" className="hidden" ref={fileInputRef} multiple accept=".csv" onChange={handleFileSelection} />
            <Files className="text-blue-500 mb-2" size={24} />
            <span className="text-sm font-bold text-gray-600 dark:text-zinc-400">Select Multiple Files</span>
          </Card>
          <Card className="p-8 border-2 border-dashed border-purple-200 dark:border-zinc-800 hover:border-purple-500 transition-all cursor-pointer rounded-3xl flex flex-col items-center justify-center bg-gray-50/30 dark:bg-zinc-900/30" onClick={() => folderInputRef.current?.click()}>
            <input type="file" className="hidden" ref={folderInputRef} webkitdirectory="" directory="" multiple onChange={handleFileSelection} />
            <FolderOpen className="text-purple-500 mb-2" size={24} />
            <span className="text-sm font-bold text-gray-600 dark:text-zinc-400">Upload Entire Folder</span>
          </Card>
      </div>

      {selectedFiles.length > 0 && (
          <Card className="p-6 bg-blue-600 text-white rounded-3xl flex justify-between items-center animate-in zoom-in">
              <div className="flex gap-6">
                  <div><p className="text-[10px] uppercase font-bold opacity-70">Queued Files</p><p className="text-xl font-black">{selectedFiles.length}</p></div>
                  <div className="border-l border-white/20 pl-6"><p className="text-[10px] uppercase font-bold opacity-70">Total Records</p><p className="text-xl font-black">~ {totalRows.toLocaleString()}</p></div>
              </div>
              <Button variant="ghost" className="text-white" onClick={() => {setSelectedFiles([]); setInputText(""); setTotalRows(0);}}><X size={20}/></Button>
          </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {operationsList.map((op) => (
          <Card key={op.id} onClick={() => setSelectedOps(prev => prev.includes(op.id) ? prev.filter(i => i !== op.id) : [...prev, op.id])}
            className={`p-6 cursor-pointer border-2 transition-all group ${selectedOps.includes(op.id) ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/40 shadow-md" : "border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200"}`}>
            <div className="text-3xl mb-2">{op.icon}</div>
            <p className="font-bold text-gray-800 dark:text-zinc-100 text-sm">{op.label}</p>
          </Card>
        ))}
      </div>

      <Button onClick={handleRunAll} disabled={isLoading || selectedFiles.length === 0} className="w-full py-8 text-xl bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg active:scale-[0.98]">
        {isLoading ? "Merging & Processing Pipeline..." : "Initialize High-Speed Analysis"}
      </Button>

      <AnswerGrid results={results} />

      <div className="pt-10 border-t mt-12 bg-gray-50/30 dark:bg-zinc-900/30 p-6 rounded-[2rem]">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800 dark:text-white"><Database className="text-blue-500" /> Global Content Search</h2>
        <div className="flex flex-col md:flex-row gap-3 mb-8">
            <Input placeholder="Query indexed historical records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-14 text-lg rounded-2xl border-2 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}/>
            <Button size="lg" onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-bold shadow-md">Search Database</Button>
        </div>
        <div className="space-y-4">
            {searchResults.map((r: any) => (
                <Card key={r.id} className="p-6 border-2 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">RECORD ID: {r.id}</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${r.score > 0 ? 'bg-green-100 text-green-700' : r.score < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>Score: {r.score}</span>
                    </div>
                    <p className="text-sm font-mono text-gray-500 dark:text-zinc-400 leading-relaxed italic">"{(r.content || "").replace(/{|}|'/g, "").substring(0, 300)}..."</p>
                </Card>
            ))}
        </div>
      </div>
    </div>
  )
}