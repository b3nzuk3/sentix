"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalLinker = void 0;
class SignalLinker {
    stopWords;
    stemCache = new Map();
    constructor() {
        this.stopWords = new Set([
            'the', 'is', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'it', 'its', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'over', 'page'
        ]);
    }
    linkSignals(theme, signals) {
        // Step 1: Start with AI-provided evidence signals
        const evidenceSignalIds = new Set(theme.evidence || []);
        const linkedSignals = new Map();
        // Add evidence signals first
        for (const signal of signals) {
            if (evidenceSignalIds.has(signal.id)) {
                linkedSignals.set(signal.id, signal);
            }
        }
        // If no signals or all are already evidence, return early
        if (signals.length === 0) {
            return Array.from(linkedSignals.values()).slice(0, 20);
        }
        // Step 2: Tokenize all signal texts to build corpus
        const signalTokens = signals.map(signal => this.tokenize(signal.text));
        // Step 3: Compute IDF across all signals
        const idf = this.computeIDF(signalTokens);
        // Step 4: Build theme vector from title + reason
        const themeTokens = this.tokenize(theme.title + ' ' + theme.reason);
        const themeVector = this.computeTFIDF(themeTokens, idf);
        // Step 5: Compute cosine similarity for each signal
        const similarityScores = [];
        for (let i = 0; i < signals.length; i++) {
            const signal = signals[i];
            const tokens = signalTokens[i];
            const signalVector = this.computeTFIDF(tokens, idf);
            const similarity = this.cosineSimilarity(themeVector, signalVector);
            // Only consider signals above threshold and not already included
            if (similarity > 0.15 && !linkedSignals.has(signal.id)) {
                similarityScores.push({ id: signal.id, text: signal.text, score: similarity });
            }
        }
        // Step 6: Sort by similarity and select top signals (up to 20 total)
        similarityScores.sort((a, b) => b.score - a.score);
        const remainingSlots = 20 - linkedSignals.size;
        const topSignals = similarityScores.slice(0, remainingSlots);
        for (const signal of topSignals) {
            linkedSignals.set(signal.id, { id: signal.id, text: signal.text });
        }
        // Return as array (max 20)
        return Array.from(linkedSignals.values()).slice(0, 20);
    }
    tokenize(text) {
        // Convert to lowercase and extract words (3+ letters)
        const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
        // Filter stop words and stem
        return words
            .filter(word => !this.stopWords.has(word))
            .map(word => this.stem(word));
    }
    stem(word) {
        // Check cache first
        if (this.stemCache.has(word)) {
            return this.stemCache.get(word);
        }
        let stemmed = word;
        // Common suffixes to remove (in order of decreasing length)
        const suffixes = [
            'ization', 'isation', // -> ize
            'ational', 'ation', 'icator', 'ication', // added ication for authentication->auth
            'fulness', // -> full
            'ousness', 'osity', // -> ous, ose
            'iveness', 'ivity', // -> ive
            'fulness', // -> ful
            'alistic', // -> al
            'ically', // -> ic
            'icator', 'ication', // for words like certification, authentication
            'ement', 'ance', 'ence', // remove
            'ability', 'ibility', // -> able, ible
            'antly', 'ently', // -> ant, ent
            'ator', 'or', 'er', // remove (agent nouns)
            'alism', 'ism', // remove
            'ness', // remove
            'ment', // remove
            'ent', 'ant', // remove
            'ship', // remove
            'ing', // remove
            'ed', // remove
            'ly', // remove
            'es', 's', // remove plural
        ];
        // Apply suffix removal iteratively until no more matches
        let changed = true;
        while (changed) {
            changed = false;
            for (const suffix of suffixes) {
                if (stemmed.length > suffix.length + 2 && stemmed.endsWith(suffix)) {
                    stemmed = stemmed.slice(0, -suffix.length);
                    // Handle doubling (e.g., "running" -> "runn" -> "run")
                    if (stemmed.length > 1 && stemmed[stemmed.length - 1] === stemmed[stemmed.length - 2]) {
                        stemmed = stemmed.slice(0, -1);
                    }
                    changed = true;
                    break; // restart from the first suffix
                }
            }
        }
        this.stemCache.set(word, stemmed);
        return stemmed;
    }
    computeIDF(docs) {
        const idf = new Map();
        const N = docs.length;
        const docFrequency = new Map();
        // Count document frequency for each term
        for (const doc of docs) {
            const uniqueTerms = new Set(doc);
            for (const term of uniqueTerms) {
                docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
            }
        }
        // Compute IDF: log(N / (1 + df(t)))
        for (const [term, df] of docFrequency.entries()) {
            idf.set(term, Math.log(N / (1 + df)));
        }
        return idf;
    }
    computeTFIDF(tokens, idf) {
        const tfidf = new Map();
        const docLength = tokens.length;
        if (docLength === 0) {
            return tfidf;
        }
        // Count term frequencies
        const termFreq = new Map();
        for (const token of tokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }
        // Compute normalized TF * IDF
        for (const [term, freq] of termFreq.entries()) {
            const tf = freq / docLength; // Normalize by document length
            const idfVal = idf.get(term) || 0;
            tfidf.set(term, tf * idfVal);
        }
        return tfidf;
    }
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        // Compute dot product and norms
        for (const [term, valA] of vecA.entries()) {
            normA += valA * valA;
            const valB = vecB.get(term) || 0;
            dotProduct += valA * valB;
        }
        for (const valB of vecB.values()) {
            normB += valB * valB;
        }
        // Avoid division by zero
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) {
            return 0;
        }
        return dotProduct / denominator;
    }
}
exports.SignalLinker = SignalLinker;
//# sourceMappingURL=signalLinker.js.map