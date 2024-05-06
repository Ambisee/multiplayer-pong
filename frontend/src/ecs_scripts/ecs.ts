/**
 * Comparator function that determines the ordering of two components
 * 
 * Parameters:
 * - `a`: entity id of the first component
 * - `b`: entity id of the second component
 * 
 * Returns:
 * - A negative number if component of `a` should come before component of `b`
 * - A zero if component of `a` and `b` are equal
 * - A positive number if component of `b` should come before component of `a`
 */
type Comparator = (a: number, b: number) => number 

interface ComponentConstructor<T> {
    new (...args: any[]): T
}

class Component {
    public constructor() {}
}

class Entity {
    private static idCount: number = 0
    
    public static generate() {
        const id = this.idCount
        this.idCount++

        return id
    }
}

class ComponentContainer<T extends Component> {
    private isSorted: boolean
    private mapEntityIdx: Map<number, number>
    private compConstructor: ComponentConstructor<T>

    public entities: Array<number>
    public components: Array<T>
    
    public constructor(constructor: ComponentConstructor<T>) {
        this.compConstructor = constructor
        this.mapEntityIdx = new Map()
        this.entities = []
        this.components = []
        this.isSorted = false
    }

    public has(entity: number): boolean {
        return this.mapEntityIdx.has(entity)
    }

    public insert(entity: number, component: T, allowReplacement: boolean = false): T {
        if (this.has(entity) && !allowReplacement) {
            throw Error(`Entity ${entity} already has an existing component.`)
        }

        if (isNaN(entity)) {
            throw Error(`Entity: NaN is not allowed.`)
        }
        
        this.entities.push(entity)
        this.components.push(component)
        this.mapEntityIdx.set(entity, this.components.length - 1)
        this.isSorted = false

        return component
    }

    public get(entity: number): T {
        const compIndex = this.mapEntityIdx.get(entity)
        
        if (compIndex === undefined) {
            throw Error(`ERROR in ${this.toString()}: Entity ${entity} has no associated component.`)
        }

        return this.components[compIndex]
    }

    public emplace(entity: number): T {
        return this.insert(entity, new this.compConstructor())
    }

    public remove(entity: number): void {
        if (!this.has(entity)) {
            throw Error(`ERROR in ${this.toString()}: Entity ${entity} has no existing component.`)
        }

        const compIndex = this.mapEntityIdx.get(entity) as number
        
        this.components[compIndex] = this.components[this.components.length - 1] as T
        this.entities[compIndex] = this.entities[this.components.length - 1] as number
        this.mapEntityIdx.set(this.entities[compIndex], compIndex)

        this.components.pop()
        this.entities.pop()
        this.mapEntityIdx.delete(entity)

        this.isSorted = false
    }

    public sort(comparator: Comparator, alwaysSort: boolean = false): void {
        // If `alwaysSort` is set to `true`, the sorting algorithm will always be called.
        // The flag can be useful if we want to sort the components by different comparator function.
        if (this.isSorted && !alwaysSort) {
            return
        }

        this.sortHelper(0, this.length(), comparator)
        this.isSorted = true
    }

    public clear(): void {
        this.mapEntityIdx.clear()
        this.entities = []
        this.components = []

        this.isSorted = false
    }

    public length(): number {
        return this.entities.length
    }

    public toString(): string {
        return `ComponentContainer<${this.compConstructor.name}>`
    }

    ///////////////////////////////////
    // Sort helper functions
    
    // Using the quicksort algorithm considering the last index as the pivot
    private sortHelper(start: number, end: number, comparator: Comparator) {
        // Case 1: the current array has 0 element
        if (end - start <= 1) {
            return
        }

        const pivot = end - 1
        let cur = end - 1

        for (let i = 0; i < end - 1; i++) {
            // Current entity should come before pivot
            if (comparator(this.entities[i], this.entities[pivot]) <= 0) {
                // Swap with `cur` if it's not pointing to the `pivot` index
                if (cur != end - 1) {
                    this.swap(i, cur)
                    cur++
                }
            }
            // Current entity should come after pivot
            else if (cur === end - 1) {
                cur = i
            }
        }

        if (cur !== pivot) {
            this.swap(pivot, cur)
        }
        
        this.sortHelper(start, cur, comparator)
        this.sortHelper(cur + 1, end, comparator)
    }

    // Swap the indices of two entities and components, and update the entity to index map
    private swap(i: number, j: number) {
        const entity1 = this.entities[i]
        const component1 = this.components[i]
        const entity2 = this.entities[j]
        const component2 = this.components[j]

        this.mapEntityIdx.set(entity1, j)
        this.mapEntityIdx.set(entity2, i)

        this.entities[i] = entity2
        this.components[i] = component2
        this.entities[j] = entity1
        this.components[j] = component1
    }
}

export { Entity, Component, ComponentContainer }