"use client"

import { useState } from "react"
import AnswerGrid from "../Answer/page" // Importing the grid from your sibling folder
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Download } from "lucide-react" // Added Download icon

// List of operations
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
  // --- STATE ---
  const [inputText, setInputText] = useState("")
  const [selectedOps, setSelectedOps] = useState<string[]>([])
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // --- LOGIC: Select/Deselect Cards ---
  const toggleOperation = (id: string) => {
    setSelectedOps((prev) =>
      prev.includes(id) ? prev.filter((op) => op !== id) : [...prev, id]
    )
  }

  // --- LOGIC: Run Analysis ---
  const handleRunAll = async () => {
    if (!inputText.trim() || selectedOps.length === 0) {
      alert("Enter text and select at least one operation")
      return
    }

    setIsLoading(true)
    try {
      // UPDATED PORT TO 5001
      const response = await fetch("http://127.0.0.1:5001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          operations: selectedOps,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setResults(data.results) 
      } else {
        alert(data.message || "Server error")
      }
    } catch (error) {
      alert("Could not connect to Python backend. Is it running on port 5001?")
    } finally {
      setIsLoading(false)
    }
  }

  // --- LOGIC: Export to CSV ---
  const handleExport = async () => {
    if (results.length === 0) return alert("No results to export");

    try {
      // UPDATED PORT TO 5001
      const response = await fetch("http://127.0.0.1:5001/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) throw new Error("Export failed");

      // Create a hidden link to download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "TextFlow_Report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Error downloading report. Check your backend export route on port 5001.");
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* 1. Input Area */}
      <Card className="p-4 shadow-sm border-gray-100">
        <textarea
          className="w-full h-44 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-900 resize-none transition-all"
          placeholder="Paste or type your text here (CSV format supported)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </Card>

      {/* 2. Operations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {operationsList.map((op) => (
          <Card
            key={op.id}
            onClick={() => toggleOperation(op.id)}
            className={`relative p-6 cursor-pointer transition-all border-2 group ${
              selectedOps.includes(op.id)
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md"
                : "border-transparent hover:border-blue-200 hover:bg-gray-50/50 shadow-sm"
            }`}
          >
            {selectedOps.includes(op.id) && (
              <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-blue-500 animate-in zoom-in" />
            )}
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{op.icon}</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{op.label}</h3>
            <p className="text-xs text-gray-500 mt-1">Click to select</p>
          </Card>
        ))}
      </div>

      {/* 3. Action Buttons Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        <Button
          size="lg"
          onClick={handleRunAll}
          disabled={isLoading}
          className="px-12 py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-bold shadow-xl transition-all active:scale-95"
        >
          {isLoading ? "Processing..." : "Run All Parallel"}
        </Button>

        {/* This button only appears after results are ready */}
        {results.length > 0 && (
          <Button 
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="px-8 py-7 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full text-lg font-bold flex items-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            Download Report
          </Button>
        )}
      </div>

      {/* 4. Output Area */}
      {results.length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h2>
            <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
          </div>
          <AnswerGrid results={results} />
        </div>
      )}
    </div>
  )
}