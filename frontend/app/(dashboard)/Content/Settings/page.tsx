"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, Settings, ShieldCheck, LogOut, Trash2, 
  RefreshCcw, Bell, AlertTriangle, Info, Copy, Check, Moon, Sun
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("chetanaswamysetty@gmail.com");
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [purgeInput, setPurgeInput] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const email = localStorage.getItem("userEmail");
    if (email) setUserEmail(email);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handlePurge = async () => {
    if (purgeInput !== "PURGE") return;
    setIsClearing(true);
    try {
      const res = await fetch("http://127.0.0.1:5001/api/cleanup", { method: "POST" });
      if (res.ok) { alert("Indexed storage purged."); setShowConfirm(false); setPurgeInput(""); }
    } catch (e) { alert("Backend failure."); }
    finally { setIsClearing(false); }
  };

  return (
    <div className="min-h-screen p-8 space-y-8 transition-colors duration-300 bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      
      {/* PURGE CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-3xl p-8 border-none bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="space-y-6 text-center">
              <AlertTriangle className="mx-auto text-red-500" size={48} />
              <h2 className="text-2xl font-bold dark:text-white tracking-tight">Destructive Action</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">All historical logs will be deleted. Type <b>PURGE</b> to confirm.</p>
              <Input value={purgeInput} onChange={e => setPurgeInput(e.target.value)} placeholder="Type PURGE here" className="text-center font-black dark:bg-zinc-800 border-red-100" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {setShowConfirm(false); setPurgeInput("")}}>Cancel</Button>
                <Button disabled={purgeInput !== 'PURGE'} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={handlePurge}>
                  {isClearing ? "Cleaning..." : "Confirm Purge"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-3">
          <Settings className="text-blue-600" size={32} />
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="space-y-8">
            {/* USER PROFILE */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] p-8 text-center transition-colors">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4 text-2xl font-bold">
                    {userEmail[0].toUpperCase()}
                </div>
                <h3 className="font-bold text-lg dark:text-white">{userEmail.split('@')[0]}</h3>
                <p className="text-xs text-gray-400 mb-6">{userEmail} (Read-only)</p>
                <Button variant="outline" className="w-full rounded-xl dark:border-zinc-700 dark:text-zinc-300" onClick={() => router.push("/Forgot-Password")}>
                    Reset Password
                </Button>
            </Card>

            {/* APPEARANCE */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] p-8 transition-colors">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Appearance</h4>
                <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl">
                    <button onClick={() => applyTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${theme === "light" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}><Sun size={16} /> Light</button>
                    <button onClick={() => applyTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${theme === "dark" ? "bg-zinc-700 text-white shadow-sm" : "text-gray-400"}`}><Moon size={16} /> Dark</button>
                </div>
            </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
            {/* API CONFIG */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-[2rem] p-8 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrative API Configuration</h4>
                    <span className="text-[10px] px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded">ENV: Development</span>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">Backend Server Endpoint</p>
                        <div className="flex gap-2">
                            <Input value="http://127.0.0.1:5001" readOnly className="bg-gray-50 dark:bg-zinc-800 border-none dark:text-zinc-300 font-mono text-sm cursor-not-allowed" />
                            <Button variant="outline" size="icon" className="rounded-xl dark:border-zinc-700" onClick={() => {navigator.clipboard.writeText("http://127.0.0.1:5001"); setCopied(true); setTimeout(()=>setCopied(false), 2000)}}>
                                {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                            </Button>
                        </div>
                        <p className="text-[10px] text-orange-600 italic flex items-center gap-1"><Info size={12}/> Locked: Intended for administrative use only.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-3"><Bell className="text-blue-600" size={20} /><p className="text-sm font-bold dark:text-white">Auto-Alerts {alertsEnabled ? '(Enabled)' : '(Disabled)'}</p></div>
                        <div className={`w-12 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1 ${alertsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`} onClick={() => setAlertsEnabled(!alertsEnabled)}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${alertsEnabled ? 'translate-x-6' : 'translate-x-0'}`} /></div>
                    </div>
                </div>
            </Card>

            {/* DANGER ZONE */}
            <Card className="border border-red-100 dark:border-red-900/20 bg-red-50/10 dark:bg-red-950/10 rounded-[2rem] p-8 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1"><h4 className="text-red-600 font-bold flex items-center gap-2"><AlertTriangle size={18}/> Restricted Area</h4><p className="text-sm text-gray-500 dark:text-zinc-400 italic">This action permanently deletes all historical data and cannot be undone.</p></div>
                    <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 rounded-2xl font-bold shadow-lg transition-transform active:scale-95" onClick={() => setShowConfirm(true)}>Purge Storage</Button>
                </div>
            </Card>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-8">
          <Button variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => {localStorage.clear(); router.push("/")}}>
              <LogOut size={18} className="mr-2"/> End Session
          </Button>
          <p className="text-[10px] text-gray-300 font-mono uppercase tracking-[0.2em]">System Core v1.0.4 // All Modules Synchronized</p>
      </div>
    </div>
  );
}