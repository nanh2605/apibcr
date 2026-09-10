// ============================================================
// shared/predict.js — THUẬT TOÁN DỰ ĐOÁN BACCARAT SIÊU VIP PRO MAX
// ============================================================

/**
 * Làm sạch chuỗi kết quả: chỉ giữ P, B, T
 * @param {string|string[]} input
 * @returns {string[]}
 */
function cleanResults(input) {
    if (Array.isArray(input)) {
        return input.filter(r => r === 'P' || r === 'B' || r === 'T');
    }
    if (typeof input === 'string') {
        return input.replace(/[^PBT]/g, '').split('');
    }
    return [];
}

/**
 * Đếm số lượng P, B, T
 */
function countResults(results) {
    let P = 0, B = 0, T = 0;
    for (const r of results) {
        if (r === 'P') P++;
        else if (r === 'B') B++;
        else if (r === 'T') T++;
    }
    return { P, B, T, total: results.length };
}

// ============================================================
// THUẬT TOÁN 1: CẦU BỆT (Streak Follow)
// Nếu n nước cuối giống nhau → theo bệt
// ============================================================
function algoCauBet(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 3) return null;
    
    const last = clean[clean.length - 1];
    let streak = 1;
    
    for (let i = clean.length - 2; i >= 0; i--) {
        if (clean[i] === last) streak++;
        else break;
    }
    
    if (streak >= 3) {
        // Bệt càng dài → càng tin tưởng (nhưng có giới hạn, bệt dài quá dễ gãy)
        let conf = 55 + Math.min(streak * 3, 25);
        if (streak >= 8) conf -= 15; // bệt quá dài → giảm tin cậy
        return {
            algo: 'cau_bet',
            val: last,
            conf: Math.min(conf, 85),
            streak: streak
        };
    }
    return null;
}

// ============================================================
// THUẬT TOÁN 2: CẦU 1-1 (PBPB / BPBP)
// ============================================================
function algoCau11(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 4) return null;
    
    const last4 = clean.slice(-4).join('');
    if (last4 === 'PBPB') return { algo: 'cau_1_1', val: 'P', conf: 70 };
    if (last4 === 'BPBP') return { algo: 'cau_1_1', val: 'B', conf: 70 };
    
    // Kiểm tra 6 nước
    if (clean.length >= 6) {
        const last6 = clean.slice(-6).join('');
        if (last6 === 'PBPBPB') return { algo: 'cau_1_1', val: 'P', conf: 78 };
        if (last6 === 'BPBPBP') return { algo: 'cau_1_1', val: 'B', conf: 78 };
    }
    
    return null;
}

// ============================================================
// THUẬT TOÁN 3: CẦU 2-2 (PPBBPPBB)
// ============================================================
function algoCau22(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 8) return null;
    
    const last8 = clean.slice(-8).join('');
    if (last8 === 'PPBBPPBB') return { algo: 'cau_2_2', val: 'P', conf: 72 };
    if (last8 === 'BBPPBBPP') return { algo: 'cau_2_2', val: 'B', conf: 72 };
    
    return null;
}

// ============================================================
// THUẬT TOÁN 4: CẦU 3-3 (PPPBBBPPPBBB)
// ============================================================
function algoCau33(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 12) return null;
    
    const last12 = clean.slice(-12).join('');
    if (last12 === 'PPPBBBPPPBBB') return { algo: 'cau_3_3', val: 'P', conf: 75 };
    if (last12 === 'BBBPPPBBBPPP') return { algo: 'cau_3_3', val: 'B', conf: 75 };
    
    return null;
}

// ============================================================
// THUẬT TOÁN 5: CẦU NGHIÊNG (Bias)
// Đếm 10-15 nước, bên nào nhiều hơn → theo bên đó
// ============================================================
function algoCauNghieng(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 8) return null;
    
    const last15 = clean.slice(-15);
    const { P, B, total } = countResults(last15);
    
    const diff = Math.abs(P - B);
    if (diff >= 4) {
        const val = P > B ? 'P' : 'B';
        const conf = 55 + Math.min(diff * 3, 20);
        return { algo: 'cau_nghieng', val, conf };
    }
    return null;
}

// ============================================================
// THUẬT TOÁN 6: ĐẢO CẦU (Contrarian)
// Nếu bệt quá dài (>=7) → có thể gãy → đánh ngược
// ============================================================
function algoDaoCau(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 8) return null;
    
    const last = clean[clean.length - 1];
    let streak = 1;
    for (let i = clean.length - 2; i >= 0; i--) {
        if (clean[i] === last) streak++;
        else break;
    }
    
    if (streak >= 7) {
        return {
            algo: 'dao_cau',
            val: last === 'P' ? 'B' : 'P',
            conf: 60 + Math.min((streak - 7) * 3, 15),
            streak: streak
        };
    }
    return null;
}

// ============================================================
// THUẬT TOÁN 7: MARKOV CHAIN ĐƠN GIẢN
// Xác suất chuyển tiếp dựa trên lịch sử
// ============================================================
function algoMarkov(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 10) return null;
    
    const last = clean[clean.length - 1];
    let pAfterP = 0, pAfterB = 0;
    let pNextAfterP = 0, bNextAfterP = 0;
    let pNextAfterB = 0, bNextAfterB = 0;
    
    for (let i = 0; i < clean.length - 1; i++) {
        if (clean[i] === 'P') {
            pAfterP++;
            if (clean[i + 1] === 'P') pNextAfterP++;
            else bNextAfterP++;
        } else if (clean[i] === 'B') {
            pAfterB++;
            if (clean[i + 1] === 'P') pNextAfterP = pNextAfterP; // keep
            if (clean[i + 1] === 'B') bNextAfterB++;
            else if (clean[i + 1] === 'P') pNextAfterB++;
        }
    }
    
    if (last === 'P' && pAfterP > 0) {
        const probP = pNextAfterP / pAfterP;
        const val = probP >= 0.5 ? 'P' : 'B';
        const conf = 50 + Math.abs(probP - 0.5) * 60;
        return { algo: 'markov', val, conf: Math.min(conf, 80) };
    }
    if (last === 'B' && pAfterB > 0) {
        const probP = pNextAfterB / pAfterB;
        const val = probP >= 0.5 ? 'P' : 'B';
        const conf = 50 + Math.abs(probP - 0.5) * 60;
        return { algo: 'markov', val, conf: Math.min(conf, 80) };
    }
    return null;
}

// ============================================================
// THUẬT TOÁN 8: ĐẾM 10 NƯỚC GẦN NHẤT (Baseline)
// ============================================================
function algo10g1(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length === 0) return null;
    
    const last10 = clean.slice(-10);
    const { P, B } = countResults(last10);
    
    let val;
    if (P > B) val = 'P';
    else if (B > P) val = 'B';
    else val = last10[last10.length - 1];
    
    const conf = 50 + Math.min(Math.abs(P - B) * 3, 20);
    return { algo: '10g1', val, conf };
}

// ============================================================
// THUẬT TOÁN 9: CẦU ĐỐI XỨNG (Symmetry)
// Tìm pattern lặp lại trong quá khứ
// ============================================================
function algoSymmetry(results) {
    const clean = results.filter(r => r !== 'T');
    if (clean.length < 6) return null;
    
    const last4 = clean.slice(-4).join('');
    
    // Tìm pattern 4 nước tương tự trong quá khứ
    for (let i = 0; i <= clean.length - 8; i++) {
        const past4 = clean.slice(i, i + 4).join('');
        if (past4 === last4 && i + 4 < clean.length) {
            const next = clean[i + 4];
            return { algo: 'symmetry', val: next, conf: 65 };
        }
    }
    return null;
}

// ============================================================
// HÀM CHÍNH: predictBaccarat
// Weighted voting từ tất cả thuật toán
// ============================================================
function predictBaccarat(results) {
    const clean = cleanResults(results);
    
    // Không đủ dữ liệu
    if (clean.length === 0) {
        return {
            val: 'P',
            conf: 50,
            prob_b: 0.5,
            prob_p: 0.5,
            streak: 0,
            algos: ['none'],
            details: []
        };
    }
    
    const { P, B, T, total } = countResults(clean);
    
    // Chạy tất cả thuật toán
    const algos = [
        algoCauBet(clean),
        algoCau11(clean),
        algoCau22(clean),
        algoCau33(clean),
        algoCauNghieng(clean),
        algoDaoCau(clean),
        algoMarkov(clean),
        algo10g1(clean),
        algoSymmetry(clean)
    ].filter(a => a !== null);
    
    // Nếu không có thuật toán nào → fallback
    if (algos.length === 0) {
        const last = clean[clean.length - 1];
        return {
            val: last,
            conf: 50,
            prob_b: B / total,
            prob_p: P / total,
            streak: 1,
            algos: ['fallback'],
            details: []
        };
    }
    
    // Weighted voting
    let voteP = 0, voteB = 0;
    let totalWeight = 0;
    const usedAlgos = [];
    
    for (const a of algos) {
        const weight = a.conf;
        totalWeight += weight;
        if (a.val === 'P') voteP += weight;
        else if (a.val === 'B') voteB += weight;
        usedAlgos.push(a.algo);
    }
    
    const val = voteP >= voteB ? 'P' : 'B';
    const winningWeight = Math.max(voteP, voteB);
    
    // Confidence: % đồng thuận + trung bình conf
    const agreement = winningWeight / totalWeight;
    const avgConf = totalWeight / algos.length;
    let conf = Math.round(avgConf * agreement);
    
    // Bonus nếu nhiều thuật toán đồng ý
    if (algos.length >= 3) conf += 5;
    if (algos.length >= 5) conf += 5;
    
    // Giới hạn 30-95
    conf = Math.max(30, Math.min(95, conf));
    
    // Streak hiện tại
    const last = clean[clean.length - 1];
    let streak = 1;
    for (let i = clean.length - 2; i >= 0; i--) {
        if (clean[i] === last) streak++;
        else break;
    }
    
    // Xác suất
    const prob_p = total > 0 ? P / total : 0.5;
    const prob_b = total > 0 ? B / total : 0.5;
    
    return {
        val: val,
        conf: conf,
        prob_b: prob_b,
        prob_p: prob_p,
        streak: streak,
        algos: usedAlgos,
        details: algos
    };
}

/**
 * Format response (cho API)
 */
function formatBaccaratResponse(data) {
    if (!data) return data;
    return {
        du_doan: data.val === 'B' ? 'Banker' : 'Player',
        du_doan_code: data.val,
        do_tin_cay: data.conf,
        prob_banker: `${(data.prob_b * 100).toFixed(1)}%`,
        prob_player: `${(data.prob_p * 100).toFixed(1)}%`,
        streak: data.streak,
        thuat_toan: data.algos
    };
}

module.exports = {
    predictBaccarat,
    formatBaccaratResponse
};
