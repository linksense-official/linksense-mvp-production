const { performance } = require('perf_hooks');

class MetricsCollector {
    constructor() {
        this.metrics = {
            messagesProcessed: 0,
            urlsDetected: 0,
            processingTime: [],
            errors: 0,
            optOuts: 0,
        };
        
        this.startTime = Date.now();
    }
    
    recordMessageProcessed(urlCount, processingTime) {
        this.metrics.messagesProcessed++;
        this.metrics.urlsDetected += urlCount;
        this.metrics.processingTime.push(processingTime);
        
        // 最新1000件のみ保持
        if (this.metrics.processingTime.length > 1000) {
            this.metrics.processingTime.shift();
        }
    }
    
    recordError() {
        this.metrics.errors++;
    }
    
    recordOptOut() {
        this.metrics.optOuts++;
    }
    
    getAverageProcessingTime() {
        if (this.metrics.processingTime.length === 0) return 0;
        
        const sum = this.metrics.processingTime.reduce((a, b) => a + b, 0);
        return sum / this.metrics.processingTime.length;
    }
    
    getUptime() {
        return Date.now() - this.startTime;
    }
    
    getSummary() {
        return {
            uptime: this.getUptime(),
            messagesProcessed: this.metrics.messagesProcessed,
            urlsDetected: this.metrics.urlsDetected,
            averageProcessingTime: this.getAverageProcessingTime(),
            errors: this.metrics.errors,
            optOuts: this.metrics.optOuts,
            messagesPerMinute: this.metrics.messagesProcessed / (this.getUptime() / 60000),
        };
    }
    
    reset() {
        this.metrics = {
            messagesProcessed: 0,
            urlsDetected: 0,
            processingTime: [],
            errors: 0,
            optOuts: 0,
        };
    }
}

const metricsCollector = new MetricsCollector();

function startMetricsCollection() {
    // 定期的なメトリクスログ
    setInterval(() => {
        const summary = metricsCollector.getSummary();
        console.log('📊 Metrics Summary:', summary);
    }, 300000); // 5分ごと
}

module.exports = {
    metricsCollector,
    startMetricsCollection,
};