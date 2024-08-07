async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    const screenRectValues = new Float32Array(4);

    let center_x = -0.75;
    let center_y = 0;
    let scale = 1 / 1000;

    // Get a WebGPU context from the canvas and configure it
    const canvas = document.querySelector('canvas');
    document.body.addEventListener('wheel', (e) => {
       scale *= 1 + (e.deltaY / 300);
       requestAnimationFrame(render);
    });

    document.body.addEventListener('pointermove', (e) => {
        if (!(e.buttons & 1))
            return;

        center_x -= e.movementX * scale;
        center_y += e.movementY * scale;
        requestAnimationFrame(render);
    });

    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const screenRectBuffer = device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const module = device.createShaderModule({
        label: 'our hardcoded red triangle shaders',
        code: await (await fetch('shader.wgsl')).text(),
    });

    const pipeline = device.createRenderPipeline({
        label: 'our hardcoded red triangle pipeline',
        layout: 'auto',
        vertex: {
            module,
        },
        fragment: {
            module,
            targets: [{ format: presentationFormat }],
        },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: screenRectBuffer }},
        ],
    });

    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                // view: <- to be filled out when we render
                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const canvasToSizeMap = new WeakMap();

    function resizeCanvasToDisplaySize(canvas) {
        // Get the canvas's current display size
        let { width, height } = canvasToSizeMap.get(canvas) || canvas;

        // Make sure it's valid for WebGPU
        width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
        height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

        // Only if the size is different, set the canvas size
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            canvas.width = width;
            canvas.height = height;
        }
        return needResize;
    }

    function render() {
        resizeCanvasToDisplaySize(canvas);

        const w = canvas.width * scale;
        const h = canvas.height * scale;

        screenRectValues.set([center_x - w / 2, center_y - h / 2, w, h]); // set the scale

        // copy the values from JavaScript to the GPU
        device.queue.writeBuffer(screenRectBuffer, 0, screenRectValues);

        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({ label: 'our encoder' });
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);  // call our vertex shader 3 times
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            canvasToSizeMap.set(entry.target, {
                width: entry.contentBoxSize[0].inlineSize,
                height: entry.contentBoxSize[0].blockSize,
            });
        }
        render();
    });
    observer.observe(canvas);
}

function fail(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

main();
