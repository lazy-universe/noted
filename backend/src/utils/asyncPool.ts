/**
 * Limits the number of concurrent promises running at once.
 * Useful for avoiding OS limits (file descriptors) or DB connection saturation.
 */
export async function asyncPool<T>(
    concurrency: number, 
    iterable: T[], 
    iteratorFn: (item: T) => Promise<any>
) {
    const ret: Promise<any>[] = [];
    const executing: Promise<any>[] = [];
    
    for (const item of iterable) {
        const p = Promise.resolve().then(() => iteratorFn(item));
        ret.push(p);
        
        if (concurrency <= iterable.length) {
            const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
    }
    
    return Promise.all(ret);
}
