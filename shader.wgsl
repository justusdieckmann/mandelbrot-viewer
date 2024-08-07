struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
}

@group(0) @binding(0) var<uniform> screenRect: vec4f;

@vertex fn vs(
  @builtin(vertex_index) vertexIndex : u32
) -> VertexOut {
  const pos = array(
    vec2f(-1, -1),
    vec2f(-1, 1),
    vec2f(1, 1),
    vec2f(-1, -1),
    vec2f(1, 1),
    vec2f(1, -1)
  );

  var output: VertexOut;
  output.pos = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.uv = output.pos.xy * 0.5 + 0.5;
  return output;
}

@fragment fn fs(data: VertexOut) -> @location(0) vec4f {
  let inside = mandelbrot(data.uv.x * screenRect.z + screenRect.x, data.uv.y * screenRect.w + screenRect.y);
  if inside {
    return vec4f(1.0, 1.0, 1.0, 1.0);
  } else {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
}

fn mandelbrot(a: f32, b: f32) -> bool {
    var za = a;
    var zb = b;
    for (var i = 0; i < 50; i++) {
        let na = za * za - zb * zb;
        zb = 2 * za * zb + b;
        za = na + a;
        if abs(za) > 5 || abs(zb) > 5 {
            return false;
        }
    }
    return true;
}
