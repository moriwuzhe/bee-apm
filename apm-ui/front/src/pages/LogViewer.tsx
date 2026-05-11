import { useState, useEffect, useRef } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { SearchBar } from "@/components/business";
import { RefreshCw, Download, Trash2, Filter, FileText, Clock, ChevronDown, X, Search, AlertTriangle, Settings, Activity, Zap, Database, Shield, TrendingUp } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { logsApi } from "../services/api";

interface LogEntry {
  id: number;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  time: string;
  service: string;
  content: string;
  traceId?: string;
}

const levelColors: Record<string, { bg: string; color: string; label: string }> = {
  INFO:  { bg: "rgba(22,93,255,0.12)",  color: "#60A5FA", label: "INFO"  },
  WARN:  { bg: "rgba(255,170,0,0.12)",  color: "#FFAA00", label: "WARN"  },
  ERROR: { bg: "rgba(255,77,79,0.12)",   color: "#FF4D4F", label: "ERROR" },
  DEBUG: { bg: "rgba(100,116,139,0.12)",color: "#94A3B8", label: "DEBUG" },
};

export default function LogViewer() {
  const { showToast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    level: "ALL",
    keyword: "",
    startTime: "",
    endTime: "",
    appId: ""
  });
  const [savedSearches] = useState<Array<{ id: number; name: string; query: string }>>([
    { id: 1, name: "错误日志", query: "level:ERROR" },
    { id: 2, name: "最近1小时", query: "time:-1h" },
    { id: 3, name: "用户服务", query: "service:user-service" }
  ]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "数据库连接错误",
    "认证失败",
    "API超时"
  ]);
  const [logStats, setLogStats] = useState({
    total: 0,
    error: 0,
    warning: 0,
    info: 0,
    today: 0,
    avgPerMin: 0
  });
  const [levelDistribution, setLevelDistribution] = useState([
    { name: "ERROR", value: 0, color: "#FF4D4F" },
    { name: "WARN", value: 0, color: "#FFAA00" },
    { name: "INFO", value: 0, color: "#60A5FA" },
    { name: "DEBUG", value: 0, color: "#94A3B8" }
  ]);
  const [logTrend] = useState([
    { time: "00:00", count: 12 },
    { time: "04:00", count: 8 },
    { time: "08:00", count: 45 },
    { time: "12:00", count: 67 },
    { time: "16:00", count: 53 },
    { time: "20:00", count: 34 }
  ]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logsApi.queryLogs({
        level: levelFilter !== "ALL" ? levelFilter : undefined,
        keyword: search || undefined,
        page: 0,
        size: 100,
      });
      
      let transformed: LogEntry[] = [];
      if (response.data && response.data.content) {
        transformed = response.data.content.map((log: any, index: number) => ({
          id: log.id || index,
          level: log.level || "INFO",
          time: log.timestamp || log.time || new Date().toLocaleString(),
          service: log.service || log.appName || "unknown",
          content: log.message || log.content || "",
          traceId: log.traceId || log.trace_id,
        }));
      } else if (response.data && Array.isArray(response.data)) {
        transformed = response.data.map((log: any, index: number) => ({
          id: log.id || index,
          level: log.level || "INFO",
          time: log.timestamp || log.time || new Date().toLocaleString(),
          service: log.service || log.appName || "unknown",
          content: log.message || log.content || "",
          traceId: log.traceId || log.trace_id,
        }));
      }
      
      setLogs(transformed);
      
      const total = transformed.length;
      const error = transformed.filter(l => l.level === "ERROR").length;
      const warning = transformed.filter(l => l.level === "WARN").length;
      const info = transformed.filter(l => l.level === "INFO").length;
      const today = transformed.filter(l => {
        const logDate = new Date(l.time).toDateString();
        const todayStr = new Date().toDateString();
        return logDate === todayStr;
      }).length;
      
      setLogStats({
        total,
        error,
        warning,
        info,
        today,
        avgPerMin: total > 0 ? Math.round(total / 60 * 10) / 10 : 0
      });
      
      setLevelDistribution([
        { name: "ERROR", value: error, color: "#FF4D4F" },
        { name: "WARN", value: warning, color: "#FFAA00" },
        { name: "INFO", value: info, color: "#60A5FA" },
        { name: "DEBUG", value: transformed.filter(l => l.level === "DEBUG").length, color: "#94A3B8" }
      ]);
      
      showToast("日志数据加载成功", "success");
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs([]);
      showToast("日志数据加载失败", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [levelFilter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLogs();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, levelFilter]);

  const handleSearch = () => {
    loadLogs();
  };

  const handleExport = () => {
    showToast("正在导出日志...", "info");
    const data = filteredLogs.map(l => `${l.time} [${l.level}] ${l.service}: ${l.content}`).join("\n");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("日志导出成功", "success");
  };

  const handleClearLogs = () => {
    if (logs.length === 0) {
      showToast("暂无日志可清除", "info");
      return;
    }
    setLogs([]);
    showToast("日志已清除", "success");
  };

  const handleSaveSearch = () => {
    if (search.trim()) {
      const newSearch = { id: Date.now(), name: search.slice(0, 20), query: search };
      showToast("搜索已保存", "success");
    } else {
      showToast("请输入搜索内容", "warning");
    }
  };

  const handleApplyAdvancedFilters = () => {
    setSearch(searchFilters.keyword);
    setLevelFilter(searchFilters.level);
    loadLogs();
    setShowAdvancedFilters(false);
    showToast("高级筛选已应用", "success");
  };

  const handleClearAdvancedFilters = () => {
    setSearchFilters({
      level: "ALL",
      keyword: "",
      startTime: "",
      endTime: "",
      appId: ""
    });
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setSearch(searchTerm);
    loadLogs();
  };

  const handleSavedSearchClick = (query: string) => {
    setSearch(query);
    loadLogs();
  };

  const filteredLogs = logs.filter(log => {
    const matchSearch = search === "" || 
      log.content.toLowerCase().includes(search.toLowerCase()) ||
      log.service.toLowerCase().includes(search.toLowerCase()) ||
      (log.traceId && log.traceId.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const levelOptions = [
    { value: "ALL", label: "全部级别" },
    { value: "ERROR", label: "ERROR" },
    { value: "WARN", label: "WARN" },
    { value: "INFO", label: "INFO" },
    { value: "DEBUG", label: "DEBUG" },
  ];

  const totalDistribution = levelDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <MainLayout title="日志查看">
      <div data-cmp="LogViewer" className="space-y-4">
        <PageHeader
          title="日志查看器"
          subtitle={`${logs.length} 条日志`}
          actions={
            <>
              <TechButton 
                variant="secondary" 
                icon={<Download size={13} />} 
                onClick={handleExport}
              >
                导出日志
              </TechButton>
              <TechButton 
                variant={showAdvancedFilters ? "primary" : "secondary"} 
                icon={<Filter size={13} />} 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                高级筛选
              </TechButton>
              <TechButton 
                variant="secondary" 
                icon={<Search size={13} />} 
                onClick={handleSaveSearch}
              >
                保存搜索
              </TechButton>
              <div className="relative">
                <button
                  onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <span>{levelOptions.find(o => o.value === levelFilter)?.label}</span>
                  <ChevronDown size={12} />
                </button>
                {showLevelDropdown && (
                  <div className="absolute top-full left-0 mt-1 py-1 rounded-md z-10 min-w-[100px]" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    {levelOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setLevelFilter(option.value); setShowLevelDropdown(false); }}
                        className="w-full px-3 py-1.5 text-left text-xs"
                        style={{ color: levelFilter === option.value ? "#165DFF" : "var(--foreground)" }}
                      >{option.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
                placeholder="搜索日志内容..."
              />
              <TechButton
                variant={autoRefresh ? "primary" : "secondary"}
                icon={<RefreshCw size={13} />}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "停止刷新" : "自动刷新"}
              </TechButton>
              <TechButton variant="danger" icon={<Trash2 size={13} />} onClick={handleClearLogs}>清空</TechButton>
            </>
          }
        />

        {showAdvancedFilters && (
          <div className="rounded-lg p-4 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={16} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium">高级搜索筛选</span>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 rounded hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  关键词
                </label>
                <input
                  type="text"
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
                  placeholder="输入搜索关键词..."
                  className="w-full px-3 py-1.5 rounded text-xs"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  日志级别
                </label>
                <select
                  value={searchFilters.level}
                  onChange={(e) => setSearchFilters({ ...searchFilters, level: e.target.value })}
                  className="w-full px-3 py-1.5 rounded text-xs"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {levelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  value={searchFilters.startTime}
                  onChange={(e) => setSearchFilters({ ...searchFilters, startTime: e.target.value })}
                  className="w-full px-3 py-1.5 rounded text-xs"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  结束时间
                </label>
                <input
                  type="datetime-local"
                  value={searchFilters.endTime}
                  onChange={(e) => setSearchFilters({ ...searchFilters, endTime: e.target.value })}
                  className="w-full px-3 py-1.5 rounded text-xs"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  应用ID
                </label>
                <input
                  type="text"
                  value={searchFilters.appId}
                  onChange={(e) => setSearchFilters({ ...searchFilters, appId: e.target.value })}
                  placeholder="输入应用ID..."
                  className="w-full px-3 py-1.5 rounded text-xs"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>保存的搜索：</span>
              <div className="flex gap-2 flex-wrap">
                {savedSearches.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSavedSearchClick(s.query)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: "var(--muted)", color: "#165DFF" }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>最近搜索：</span>
              <div className="flex gap-2 flex-wrap">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearchClick(term)}
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  >
                    <Clock size={10} />
                    {term}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <TechButton variant="secondary" onClick={handleClearAdvancedFilters}>
                清除筛选
              </TechButton>
              <TechButton variant="primary" onClick={handleApplyAdvancedFilters}>
                应用筛选
              </TechButton>
            </div>
          </div>
        )}

        <div className="grid grid-cols-6 gap-3">
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(22,93,255,0.12)" }}>
              <Database size={20} style={{ color: "#165DFF" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#165DFF" }}>{logStats.total}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总日志数</div>
            </div>
          </div>
          
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,77,79,0.12)" }}>
              <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#FF4D4F" }}>{logStats.error}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>ERROR</div>
            </div>
          </div>
          
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,170,0,0.12)" }}>
              <Zap size={20} style={{ color: "#FFAA00" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#FFAA00" }}>{logStats.warning}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>WARNING</div>
            </div>
          </div>
          
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(96,165,250,0.12)" }}>
              <Activity size={20} style={{ color: "#60A5FA" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#60A5FA" }}>{logStats.info}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>INFO</div>
            </div>
          </div>
          
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,214,143,0.12)" }}>
              <TrendingUp size={20} style={{ color: "#00D68F" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#00D68F" }}>{logStats.today}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>今日日志</div>
            </div>
          </div>
          
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
              <Shield size={20} style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#8B5CF6" }}>{logStats.avgPerMin}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均/分钟</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium">日志级别分布</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="relative" style={{ width: "120px", height: "120px" }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {totalDistribution > 0 ? (
                    levelDistribution.map((item, index) => {
                      const percentage = (item.value / totalDistribution) * 100;
                      const previousPercentage = levelDistribution.slice(0, index).reduce((sum, i) => sum + (i.value / totalDistribution) * 100, 0);
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const strokeDashoffset = -previousPercentage;
                      return (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ opacity: 0.8 }}
                        />
                      );
                    })
                  ) : (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="20" strokeDasharray="100 100" />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold">{totalDistribution}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总计</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {levelDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                    <span style={{ color: "var(--muted-foreground)" }}>{item.name}</span>
                    <span className="font-medium" style={{ color: item.color }}>{item.value}</span>
                    {totalDistribution > 0 && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        ({Math.round((item.value / totalDistribution) * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 col-span-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium">日志趋势</span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {logTrend.map((item, index) => {
                const maxCount = Math.max(...logTrend.map(t => t.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{ 
                        height: `${height}%`,
                        background: index === logTrend.length - 1 ? "linear-gradient(180deg, #165DFF 0%, #8B5CF6 100%)" : "rgba(22,93,255,0.3)"
                      }}
                    ></div>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.count}</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={tableRef} className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="max-h-[500px] overflow-auto">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText size={48} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-4" />
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无日志数据</div>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: "#1E293B" }}>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-16">级别</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-40">时间</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-28">服务</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">日志内容</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const lc = levelColors[log.level];
                    const isExpanded = expandedLog === log.id;
                    return (
                      <tr key={log.id} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: lc.bg, color: lc.color }}>
                            {lc.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} style={{ color: "var(--muted-foreground)" }} />
                            <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-white">{log.service}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className={`text-xs ${isExpanded ? "text-white" : "text-muted-foreground truncate"}`} style={{ maxWidth: "500px" }}>
                            {isExpanded ? log.content : log.content.slice(0, 150) + (log.content.length > 150 ? "..." : "")}
                          </div>
                          {log.traceId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Trace: <span className="font-mono">{log.traceId}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: "var(--muted)", color: "var(--foreground)" }}
                          >
                            {isExpanded ? "收起" : "展开"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
