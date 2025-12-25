import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

const MethodIndicator = ({ method }) => {
    let colorClass = "bg-slate-300 dark:bg-slate-600";
    let label = "Not Defined";

    if (method === 'POS') {
        colorClass = "bg-blue-500";
        label = "POS";
    } else if (method === 'eCom') {
        colorClass = "bg-emerald-500";
        label = "eCom";
    } else if (method === 'International') {
        colorClass = "bg-orange-500";
        label = "International";
    } else if (method) {
        label = method;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 cursor-help transition-colors", colorClass)} aria-label={label} />
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

export default MethodIndicator;
