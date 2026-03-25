"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.truncate = truncate;
exports.getEffortBucketColor = getEffortBucketColor;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}
function truncate(str, length) {
    if (str.length <= length)
        return str;
    return str.slice(0, length) + '...';
}
function getEffortBucketColor(bucket) {
    switch (bucket) {
        case 'SMALL':
            return 'bg-success text-success-foreground';
        case 'MEDIUM':
            return 'bg-warning text-warning-foreground';
        case 'LARGE':
            return 'bg-destructive text-destructive-foreground';
        default:
            return 'bg-muted text-muted-foreground';
    }
}
//# sourceMappingURL=utils.js.map