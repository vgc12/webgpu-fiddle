const MAX_WORKGROUP_COUNT_PER_DIMENSION = 65535; // WebGPU spec minimum guarantee
const MAX_WORKGROUP_INVOCATIONS = 256; // sizeX × sizeY × sizeZ

/**
 * Validates and clamps workgroup counts to WebGPU limits
 * Prevents GPU crashes from exceeding hardware limits
 */
export function validateAndClampWorkgroupCount(
    count: [number, number, number],
    workgroupSize: [number, number, number]
): [number, number, number] {
    // Validate workgroup size (must be <= 256 total invocations)
    const totalInvocations = workgroupSize[0] * workgroupSize[1] * workgroupSize[2];
    if (totalInvocations > MAX_WORKGROUP_INVOCATIONS) {
        throw new Error(
            `Workgroup size ${workgroupSize} exceeds max invocations (${MAX_WORKGROUP_INVOCATIONS}). ` +
            `Got ${totalInvocations}.`
        );
    }

    // Clamp workgroup count per dimension
    const clampedCount: [number, number, number] = [
        Math.min(count[0], MAX_WORKGROUP_COUNT_PER_DIMENSION),
        Math.min(count[1], MAX_WORKGROUP_COUNT_PER_DIMENSION),
        Math.min(count[2], MAX_WORKGROUP_COUNT_PER_DIMENSION)
    ];

    // Warn if clamped
    if (
        count[0] !== clampedCount[0] ||
        count[1] !== clampedCount[1] ||
        count[2] !== clampedCount[2]
    ) {
        console.warn(
            `Workgroup count ${count} exceeds limits, clamped to ${clampedCount}`
        );
    }

    return clampedCount;
}

/**
 * Calculates optimal workgroup dispatch counts based on total count and workgroup size
 */
export function calculateWorkgroupCount(
    totalCount: number,
    workgroupSize: [number, number, number]
): [number, number, number] {
    const [sizeX, sizeY, sizeZ] = workgroupSize;
    //console.log('calculateWorkgroupCount:', totalCount, workgroupSize);
    let workgroupCount: [number, number, number];

    if (sizeY === 1 && sizeZ === 1) {
        // 1D dispatch
        workgroupCount = [Math.ceil(totalCount / sizeX), 1, 1];
    } else if (sizeZ === 1) {
        // 2D dispatch
        const gridSize = Math.ceil(Math.sqrt(totalCount));
        workgroupCount = [
            Math.ceil(gridSize / sizeX),
            Math.ceil(gridSize / sizeY),
            1
        ];
    } else {
        // 3D dispatch
        const gridSize = Math.ceil(Math.cbrt(totalCount));
        workgroupCount = [
            Math.ceil(gridSize / sizeX),
            Math.ceil(gridSize / sizeY),
            Math.ceil(gridSize / sizeZ)
        ];
    }

    return validateAndClampWorkgroupCount(workgroupCount, workgroupSize);
}