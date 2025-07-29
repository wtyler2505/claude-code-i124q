# AI Agent Performance Optimization

Advanced performance analysis and optimization recommendations using AI-powered code analysis.

## Usage

```bash
# Run performance optimization analysis
claude-code-config --agent-optimize

# Interactive mode
claude-code-config --ai-agents
# Then select "Performance Optimization"
```

## Analysis Areas

### Code Performance
- **Algorithmic complexity** - Big O analysis and optimization opportunities
- **Memory usage** - Memory leaks, excessive allocations, garbage collection
- **CPU bottlenecks** - Hot paths and inefficient computations
- **I/O optimization** - Database queries, file operations, network calls

### Frontend Performance
- **Bundle size optimization** - Code splitting, tree shaking, lazy loading
- **Rendering performance** - DOM manipulation, re-renders, layout thrashing  
- **Resource loading** - Images, CSS, JavaScript optimization
- **Core Web Vitals** - LCP, FID, CLS improvements

### Backend Performance
- **API response times** - Query optimization, caching strategies
- **Database performance** - Index analysis, query patterns, N+1 problems
- **Connection pooling** - Database connections, HTTP clients
- **Caching strategies** - Redis, in-memory, CDN optimization

### System Architecture
- **Scalability bottlenecks** - Single points of failure, resource constraints
- **Microservices optimization** - Service boundaries, communication patterns
- **Infrastructure** - Load balancing, auto-scaling, resource allocation

## Optimization Strategy

The agent generates a prioritized roadmap:

1. **Quick Wins** (Low effort, high impact)
   - Simple algorithmic improvements
   - Basic caching implementation
   - Database index additions

2. **Medium-term Improvements** (Moderate effort, significant impact)  
   - Code refactoring for performance
   - Architecture pattern improvements
   - Advanced caching strategies

3. **Long-term Changes** (High effort, transformative impact)
   - System architecture redesign
   - Technology stack upgrades
   - Infrastructure optimization

## Output

- Performance analysis report with specific metrics
- Code optimization recommendations with before/after examples
- Database query optimization suggestions
- Caching strategy implementation guide
- Monitoring and measurement setup instructions

## Files Created

- `.claude/agents/reports/optimization-[session-id].json` - Detailed analysis report
- `.claude/agents/conversations/optimization-[session-id].json` - Conversation history

## Performance Metrics

The agent provides quantitative analysis where possible:
- Response time improvements (ms)
- Memory usage reduction (MB/%)
- Bundle size reduction (KB/%)
- Database query performance gains
- Scalability improvement estimates

## Integration

Uses Claude Code SDK for intelligent analysis of your codebase, understanding context across files, dependencies, and architecture patterns to provide actionable optimization recommendations.