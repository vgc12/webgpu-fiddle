/**Defines the source code for each shader stage in a template.
 The optional backgroundShader is a fragment shader rendered as a full-screen
 pass behind particle instances.
 eslint-disable-next-line @typescript-eslint/naming-convention
*/
export interface ShaderConfig {
    computeShader: string;
    vertexShader: string;
    fragmentShader: string;
    backgroundShader?: string;
}