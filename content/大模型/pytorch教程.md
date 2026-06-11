# PyTorch 教程

## 1. PyTorch 是什么

PyTorch 是一个常用的深度学习框架，适合研究实验、模型训练和工程部署。它的核心特点是张量计算、自动求导、动态图执行，以及围绕神经网络训练提供的一整套工具。

典型工作流如下：

1. 准备数据。
2. 定义模型。
3. 定义损失函数和优化器。
4. 前向传播得到预测。
5. 反向传播计算梯度。
6. 更新模型参数。
7. 评估和保存模型。

## 2. 安装

建议根据自己的 CUDA 版本从 PyTorch 官网选择安装命令。CPU 版本通常可以这样安装：

```bash
pip install torch torchvision torchaudio
```

验证安装：

```python
import torch

print(torch.__version__)
print(torch.cuda.is_available())
```

## 3. 张量基础

张量是 PyTorch 中最基础的数据结构，可以理解为多维数组。

```python
import torch

x = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
y = torch.ones(2, 2)

print(x + y)
print(x.shape)
print(x.dtype)
```

常用创建方式：

```python
torch.zeros(3, 4)
torch.ones(3, 4)
torch.randn(3, 4)
torch.arange(0, 10)
```

张量可以放到 GPU 上计算：

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
x = x.to(device)
```

## 4. 自动求导

PyTorch 使用 `autograd` 自动计算梯度。只要张量设置了 `requires_grad=True`，PyTorch 就会记录相关计算。

```python
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x ** 2 + 3 * x + 1

y.backward()

print(x.grad)
```

这里 `x.grad` 保存的是 `y` 对 `x` 的导数。

## 5. 定义神经网络

神经网络通常继承 `torch.nn.Module`。

```python
import torch
from torch import nn

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(10, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.net(x)

model = SimpleNet()
print(model)
```

常见层：

```python
nn.Linear(输入维度, 输出维度)
nn.ReLU()
nn.Conv2d(输入通道, 输出通道, kernel_size=3)
nn.MaxPool2d(kernel_size=2)
nn.Dropout(p=0.5)
```

## 6. 数据集和 DataLoader

`Dataset` 负责定义单条数据如何读取，`DataLoader` 负责批量加载、打乱和并行读取。

```python
import torch
from torch.utils.data import Dataset, DataLoader

class ToyDataset(Dataset):
    def __init__(self):
        self.x = torch.randn(100, 10)
        self.y = torch.randn(100, 1)

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]

dataset = ToyDataset()
dataloader = DataLoader(dataset, batch_size=16, shuffle=True)
```

## 7. 一个完整训练循环

```python
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

x = torch.randn(1000, 10)
y = x.sum(dim=1, keepdim=True) + torch.randn(1000, 1) * 0.1

dataset = TensorDataset(x, y)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 1)
)

loss_fn = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(10):
    total_loss = 0.0

    for batch_x, batch_y in dataloader:
        pred = model(batch_x)
        loss = loss_fn(pred, batch_y)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"epoch={epoch}, loss={total_loss / len(dataloader):.4f}")
```

训练循环中最重要的四步：

1. `pred = model(batch_x)`：前向传播。
2. `loss = loss_fn(pred, batch_y)`：计算损失。
3. `loss.backward()`：反向传播。
4. `optimizer.step()`：更新参数。

## 8. 模型评估

评估时应该关闭梯度计算，并把模型切换到评估模式。

```python
model.eval()

with torch.no_grad():
    pred = model(x[:5])
    print(pred)
```

训练时再切回训练模式：

```python
model.train()
```

`train()` 和 `eval()` 会影响 Dropout、BatchNorm 等层的行为。

## 9. 保存和加载模型

推荐保存模型参数：

```python
torch.save(model.state_dict(), "model.pt")
```

加载时需要先创建同样结构的模型：

```python
model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 1)
)

model.load_state_dict(torch.load("model.pt"))
model.eval()
```

## 10. 学习路线

建议按这个顺序学习：

1. 张量操作和广播机制。
2. 自动求导。
3. `nn.Module` 和常见网络层。
4. `Dataset`、`DataLoader` 和数据预处理。
5. 训练循环、验证集、过拟合控制。
6. GPU 训练、混合精度和模型保存。
7. 图像、文本或多模态任务中的实际项目。

## 11. 常见问题

### 为什么每次训练前要 `optimizer.zero_grad()`

PyTorch 默认会累积梯度。如果不清空梯度，当前 batch 的梯度会和之前 batch 的梯度相加。

### `model.train()` 和 `model.eval()` 有什么区别

它们控制模型中某些层的行为。例如 Dropout 在训练时随机丢弃神经元，在评估时关闭随机丢弃。

### 什么时候使用 GPU

当模型和数据规模较大时，GPU 通常能显著加速训练。小模型或小数据不一定有明显收益。

## 12. 参考视频

https://www.youtube.com/watch?v=V_xro1bcAuA
