# JAX 教程

## 1. JAX 是什么

JAX 是一个面向高性能数值计算和机器学习研究的 Python 库。它提供类似 NumPy 的数组 API，同时支持自动求导、即时编译、向量化和硬件加速。

JAX 的核心能力可以概括为四个函数：

1. `grad`：自动求导。
2. `jit`：即时编译，加速函数执行。
3. `vmap`：自动批量向量化。
4. `pmap`：跨设备并行计算。

## 2. 安装

CPU 版本通常可以这样安装：

```bash
pip install jax
```

验证安装：

```python
import jax
import jax.numpy as jnp

print(jax.devices())
print(jnp.array([1, 2, 3]))
```

如果需要 GPU 或 TPU 支持，建议根据官方安装说明选择对应命令。

## 3. JAX NumPy 基础

JAX 提供 `jax.numpy`，使用方式和 NumPy 很像。

```python
import jax.numpy as jnp

x = jnp.array([1.0, 2.0, 3.0])
y = jnp.ones(3)

print(x + y)
print(jnp.mean(x))
print(jnp.dot(x, y))
```

和普通 NumPy 的重要区别是：JAX 数组通常是不可变的。修改数组时需要使用函数式写法。

```python
x = jnp.array([1, 2, 3])
x = x.at[0].set(10)

print(x)
```

## 4. 自动求导

`jax.grad` 可以对 Python 函数求导。

```python
import jax
import jax.numpy as jnp

def f(x):
    return x ** 2 + 3 * x + 1

df = jax.grad(f)

print(df(2.0))
```

对多参数函数求导：

```python
def loss(w, b, x, y):
    pred = w * x + b
    return jnp.mean((pred - y) ** 2)

grad_w_b = jax.grad(loss, argnums=(0, 1))

w_grad, b_grad = grad_w_b(1.0, 0.0, jnp.array([1.0, 2.0]), jnp.array([2.0, 4.0]))
print(w_grad, b_grad)
```

## 5. 使用 jit 加速

`jax.jit` 会把函数编译为更高效的形式，适合重复执行的数值计算。

```python
import jax
import jax.numpy as jnp

@jax.jit
def compute(x):
    return jnp.sin(x) + jnp.cos(x)

x = jnp.arange(1000.0)
print(compute(x))
```

第一次调用可能较慢，因为 JAX 正在编译；后续调用通常会更快。

## 6. 使用 vmap 批量化

`vmap` 可以把处理单个样本的函数自动扩展为处理一批样本。

```python
import jax
import jax.numpy as jnp

def square(x):
    return x ** 2

batch_square = jax.vmap(square)

x = jnp.array([1.0, 2.0, 3.0])
print(batch_square(x))
```

更接近机器学习的例子：

```python
def predict(w, x):
    return jnp.dot(w, x)

w = jnp.array([0.2, 0.5, 0.3])
xs = jnp.array([
    [1.0, 0.0, 2.0],
    [0.0, 1.0, 1.0],
    [2.0, 1.0, 0.0],
])

batch_predict = jax.vmap(predict, in_axes=(None, 0))
print(batch_predict(w, xs))
```

## 7. 随机数

JAX 的随机数是显式管理的。你需要创建 key，并在每次使用前拆分 key。

```python
import jax

key = jax.random.PRNGKey(0)
key, subkey = jax.random.split(key)

x = jax.random.normal(subkey, shape=(3, 4))
print(x)
```

这种设计让随机过程更可控，也更适合并行和可复现实验。

## 8. 一个简单线性回归

```python
import jax
import jax.numpy as jnp

key = jax.random.PRNGKey(0)

x = jnp.linspace(-1, 1, 100)
y = 3.0 * x + 2.0 + 0.1 * jax.random.normal(key, shape=x.shape)

def predict(params, x):
    w, b = params
    return w * x + b

def loss_fn(params, x, y):
    pred = predict(params, x)
    return jnp.mean((pred - y) ** 2)

@jax.jit
def train_step(params, x, y, lr):
    grads = jax.grad(loss_fn)(params, x, y)
    return tuple(p - lr * g for p, g in zip(params, grads))

params = (jnp.array(0.0), jnp.array(0.0))

for step in range(1000):
    params = train_step(params, x, y, 0.1)

    if step % 200 == 0:
        print(step, loss_fn(params, x, y))

print(params)
```

这个例子展示了 JAX 的典型风格：

1. 参数是显式传入和返回的。
2. 函数尽量保持纯函数形式。
3. 梯度计算和编译通过函数变换完成。

## 9. JAX 和 PyTorch 的差异

PyTorch 更偏向动态图和工程生态，写法接近传统 Python 面向对象风格。JAX 更偏向函数式编程和可组合的函数变换，适合高性能研究代码、数值计算和需要大规模并行的实验。

常见差异：

1. PyTorch 模型通常是 `nn.Module`，JAX 通常显式传递参数。
2. PyTorch 的随机数管理比较隐式，JAX 的随机数 key 是显式的。
3. PyTorch 张量可以原地修改，JAX 数组倾向不可变。
4. JAX 的 `jit`、`vmap`、`grad` 可以像积木一样组合。

## 10. 学习路线

建议按这个顺序学习：

1. `jax.numpy` 基础操作。
2. 不可变数组和 `.at[]` 更新。
3. `grad` 自动求导。
4. `jit` 编译加速。
5. `vmap` 批量化。
6. 随机数 key 管理。
7. 使用 Flax、Equinox 或 Haiku 构建神经网络。
8. 学习 Optax 优化器和训练循环。

## 11. 常见问题

### 为什么 JAX 数组不能直接修改

JAX 倾向函数式编程和可编译计算图。不可变数据结构更利于编译、优化和并行化。

### `jit` 适合所有函数吗

不适合。`jit` 更适合数值计算密集、会重复执行的函数。如果函数包含大量 Python 控制逻辑、文件读写或动态对象操作，收益可能很低，甚至会报错。

### 为什么随机数要手动 split

显式拆分随机数 key 可以让随机过程更可复现，也避免并行计算时出现隐式状态冲突。

## 12. 参考视频

https://www.youtube.com/watch?v=juy9nrcTBck
