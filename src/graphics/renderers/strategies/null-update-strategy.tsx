import type {IUpdateStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";

/** No-op update strategy for canvas renderers (no compute pass needed). */
export class NullUpdateStrategy implements IUpdateStrategy {
    public update(): void {
    }
}
