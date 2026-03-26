import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Shield, ShieldCheck, Trash2, X, RefreshCw, AlertCircle } from "lucide-react";
import { ruleAPI } from '@/services/api';

export default function RiskRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form state for new rule
    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        targetField: 'amount',
        operator: '>',
        value: '',
        action: 'flag',
        severity: 'Medium'
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await ruleAPI.getAllRules();
            if (response.success) {
                setRules(response.data);
            }
        } catch (err) {
            console.error("Error fetching rules:", err);
            setError("Failed to load risk rules");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            // Optimistic UI update
            setRules(rules.map(r => r._id === rule._id ? { ...r, isActive: !r.isActive } : r));
            await ruleAPI.updateRule(rule._id, { isActive: !rule.isActive });
        } catch (err) {
            console.error("Error toggling rule:", err);
            // Revert on failure
            fetchRules();
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm("Are you sure you want to delete this risk rule?")) return;
        try {
            await ruleAPI.deleteRule(id);
            setRules(rules.filter(r => r._id !== id));
        } catch (err) {
            console.error("Error deleting rule:", err);
            alert("Failed to delete rule.");
        }
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            
            // Basic validation
            if (!newRule.name || !newRule.description || !newRule.value) {
                throw new Error("Please fill in all required fields.");
            }

            // Convert value to number if it's a number
            const submissionData = { ...newRule };
            if (!isNaN(submissionData.value) && submissionData.value !== '') {
                submissionData.value = Number(submissionData.value);
            }

            const response = await ruleAPI.createRule(submissionData);
            if (response.success) {
                setRules([response.data, ...rules]);
                setShowModal(false);
                // Reset form
                setNewRule({
                    name: '',
                    description: '',
                    targetField: 'amount',
                    operator: '>',
                    value: '',
                    action: 'flag',
                    severity: 'Medium'
                });
            }
        } catch (err) {
            console.error("Error creating rule:", err);
            setError(err.message || "Failed to create rule. Please check your inputs.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Risk Rules Engine</h2>
                    <p className="text-slate-500">Configure automated fraud detection heuristics and thresholds.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Rule
                </button>
            </div>

            {rules.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                        <Shield className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No Rules Configured</h3>
                        <p className="text-slate-500 max-w-sm mt-1">Create risk rules to automatically evaluate transactions for fraudulent patterns.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {rules.map((rule) => (
                        <Card key={rule._id} className={!rule.isActive ? 'opacity-75 bg-slate-50' : ''}>
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-full mt-1 flex-shrink-0 ${rule.isActive ? 'bg-blue-100' : 'bg-slate-200'}`}>
                                            {rule.isActive ? <ShieldCheck className="w-5 h-5 text-blue-700" /> : <Shield className="w-5 h-5 text-slate-400" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center flex-wrap gap-2">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {rule.name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                    rule.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    rule.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    rule.severity === 'Low' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {rule.severity}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                                                    rule.action === 'block' ? 'bg-red-100 text-red-800' :
                                                    rule.action === 'review' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    ACTION: {rule.action}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">{rule.description}</p>
                                            
                                            <div className="mt-3 inline-flex items-center text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                <span className="font-semibold text-slate-800">IF</span>&nbsp;{rule.targetField}&nbsp;<span className="text-blue-600 font-bold">{rule.operator}</span>&nbsp;{rule.value}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 self-end sm:self-center">
                                        <button 
                                            onClick={() => handleDeleteRule(rule._id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-2"
                                            title="Delete Rule"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div 
                                            onClick={() => handleToggleRule(rule)}
                                            className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${rule.isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rule.isActive ? 'left-6' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Rule Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">Create Risk Rule</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {error && (
                                <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
                                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleCreateRule} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                                        <input 
                                            type="text" 
                                            value={newRule.name}
                                            onChange={e => setNewRule({...newRule, name: e.target.value})}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                            placeholder="e.g., High Value Transfer"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea 
                                            value={newRule.description}
                                            onChange={e => setNewRule({...newRule, description: e.target.value})}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                            placeholder="Explain what this rule does..."
                                            rows="2"
                                            required
                                        />
                                    </div>

                                    {/* Logic Builder */}
                                    <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rule Logic</label>
                                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                                            <span className="font-mono text-sm font-bold text-slate-700">IF</span>
                                            <select 
                                                value={newRule.targetField}
                                                onChange={e => setNewRule({...newRule, targetField: e.target.value})}
                                                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                                            >
                                                <option value="amount">Transaction Amount</option>
                                                <option value="velocity">Velocity (Txns/Hour)</option>
                                                <option value="dailyTotal">Daily Total Volume</option>
                                            </select>
                                            
                                            <select 
                                                value={newRule.operator}
                                                onChange={e => setNewRule({...newRule, operator: e.target.value})}
                                                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono outline-none focus:border-blue-500"
                                            >
                                                <option value=">">&gt; (Greater than)</option>
                                                <option value=">=">&gt;= (Greater or eq)</option>
                                                <option value="<">&lt; (Less than)</option>
                                                <option value="==">== (Equals)</option>
                                            </select>

                                            <input 
                                                type="text" 
                                                value={newRule.value}
                                                onChange={e => setNewRule({...newRule, value: e.target.value})}
                                                className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono outline-none focus:border-blue-500" 
                                                placeholder="Value (e.g. 10000)"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Action to Take</label>
                                        <select 
                                            value={newRule.action}
                                            onChange={e => setNewRule({...newRule, action: e.target.value})}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="flag">Flag (Mark Suspicious)</option>
                                            <option value="review">Review (Hold for Analyst)</option>
                                            <option value="block">Block (Reject Transaction)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                                        <select 
                                            value={newRule.severity}
                                            onChange={e => setNewRule({...newRule, severity: e.target.value})}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100 space-x-3">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Create Rule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
