struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
}

const length = 4;
const mask16 = 0xFFFF;

struct PrecisionFloat {
    exponent: i32,
    mantissa: array<u32, length>,
}

fn add_to(a: ptr<private, PrecisionFloat>, b: PrecisionFloat) {
    var carry: u32 = 0;
    for (var i = 0; i < length; i++) {
        let f: u32 = a.mantissa[i] + b.mantissa[i] + carry;
        carry = u32(f < min(a.mantissa[i], b.mantissa[i]));
        a.mantissa[i] = f;
    }
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
  cool();
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

/*fn precise_mandelbrot(a: PrecisionFloat, b: PrecisionFloat) -> bool {
    var za = a;
    var zb = b;
    for (var i = 0; i < 50; i++) {
        let za2 = sq(za);
        let zb2 = sq(zb);
        if bigger_than_4(add(za2, zb2)) {
            return false;
        }
        let na = add(z);
    }
}*/

fn cool() -> PrecisionFloat {
  var pf: PrecisionFloat;
  return pf;
}

