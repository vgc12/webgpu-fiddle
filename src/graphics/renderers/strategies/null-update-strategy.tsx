import type {IUpdateStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";

export class NullUpdateStrategy implements IUpdateStrategy {
    public update(): void {
    }
}
