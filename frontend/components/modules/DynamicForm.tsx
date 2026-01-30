import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Loader2, Upload, ChevronDown } from 'lucide-react';

interface FormField {
    name: string;
    type: 'text' | 'number' | 'select' | 'file';
    label: string;
    required?: boolean;
    options?: string[];
    default?: any;
}

interface DynamicFormProps {
    fields: FormField[];
    onSubmit: (data: any) => void;
    executing: boolean;
    submitLabel?: string;
}

export default function DynamicForm({ fields, onSubmit, executing, submitLabel = "Initialize_Run" }: DynamicFormProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

    const onFormSubmit = (data: any) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="space-y-4">
                {fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {field.label} {field.required && <span className="text-stardust-violet">*</span>}
                        </Label>

                        {field.type === 'select' ? (
                            <div className="relative">
                                <select
                                    {...register(field.name, { required: field.required })}
                                    defaultValue={field.default || ""}
                                    className="w-full h-10 px-4 bg-oled-black border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-stardust-violet/30 transition-all appearance-none cursor-pointer"
                                    style={{ borderRadius: '2px' }}
                                >
                                    <option value="" disabled className="bg-black">Select_{field.label}...</option>
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt} className="bg-black text-white">{opt}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-600 pointer-events-none" />
                            </div>
                        ) : field.type === 'file' ? (
                            <div className="relative group">
                                <input
                                    type="file"
                                    className="hidden"
                                    id={`file-${field.name}`}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setValue(field.name, file.name);
                                    }}
                                />
                                <label
                                    htmlFor={`file-${field.name}`}
                                    className="flex items-center justify-between w-full h-10 px-4 bg-oled-black border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:border-stardust-violet/30 transition-all"
                                    style={{ borderRadius: '2px' }}
                                >
                                    {watch(field.name) || `Upload_${field.label}...`}
                                    <Upload className="h-4 w-4 text-slate-600 group-hover:text-stardust-violet" />
                                </label>
                            </div>
                        ) : (
                            <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                {...register(field.name, { required: field.required })}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                className="w-full h-10 px-4 bg-oled-black border border-white/10 text-[10px] font-bold text-white placeholder:text-slate-700 uppercase tracking-widest focus:outline-none focus:border-stardust-violet/30 transition-all"
                                style={{ borderRadius: '2px' }}
                            />
                        )}

                        {errors[field.name] && (
                            <span className="text-[8px] font-black text-stardust-violet uppercase tracking-widest">
                                {field.label}_is_required
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <Button
                type="submit"
                disabled={executing}
                className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-stardust-violet text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                style={{ borderRadius: '2px' }}
            >
                {executing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Play className="h-4 w-4 mr-2 fill-black" />
                )}
                {submitLabel}
            </Button>
        </form>
    );
}
