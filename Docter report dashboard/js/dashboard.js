// Dashboard functionality
async function loadDashboardStats() {
    try {
        const response = await fetch('php/api.php?action=stats');
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update stats
            document.getElementById('total-users').textContent = formatNumber(data.total_users);
            document.getElementById('total-doctors').textContent = data.total_doctors;
            document.getElementById('total-reports').textContent = data.total_reports;
            document.getElementById('total-feedbacks').textContent = data.total_feedbacks;
            
            // Draw charts
            drawUserChart(data.user_breakdown);
            drawReportsChart(data.reports_trend);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

function drawUserChart(data) {
    const canvas = document.getElementById('user-chart');
    const ctx = canvas.getContext('2d');
    
    // Simple donut chart
    const colors = ['#667eea', '#5b6ef5', '#f093fb'];
    let total = data.reduce((sum, item) => sum + parseInt(item.count), 0);
    let currentAngle = -Math.PI / 2;
    
    data.forEach((item, index) => {
        const sliceAngle = (parseInt(item.count) / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(200, 150, 100, currentAngle, currentAngle + sliceAngle);
        ctx.arc(200, 150, 50, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Legend
    let legendY = 250;
    data.forEach((item, index) => {
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(50, legendY, 15, 15);
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px sans-serif';
        ctx.fillText(item.role + ': ' + item.count, 75, legendY + 12);
        legendY += 25;
    });
}

function drawReportsChart(data) {
    const canvas = document.getElementById('reports-chart');
    const ctx = canvas.getContext('2d');
    
    if (data.length === 0) return;
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data.map(d => parseInt(d.count)));
    
    // Draw axes
    ctx.strokeStyle = '#e1e8ed';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = data.length > 1
            ? padding + (index / (data.length - 1)) * chartWidth
            : padding + chartWidth / 2;
        const y = canvas.height - padding - (parseInt(point.count) / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw point
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    ctx.stroke();
}

// Load dashboard on page load
loadDashboardStats();
