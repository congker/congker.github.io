# TensorFlow 图像识别与卷积神经网络

## 1. 图像识别为什么常用 CNN

图像识别的输入通常不是一维特征表，而是带有空间结构的像素矩阵。灰度图可以看成一个二维矩阵，彩色图像一般可以看成 `高度 × 宽度 × 通道数` 的三维张量。例如一张 RGB 图片的每个像素都有红、绿、蓝三个通道。

如果直接把图像拉平成向量再接全连接网络，模型会遇到两个问题：

1. 参数量很大。图像尺寸稍大时，全连接层需要学习的权重会迅速膨胀。
2. 空间信息被削弱。相邻像素之间的局部关系对图像识别很重要，拉平后不容易显式利用这种结构。

卷积神经网络（Convolutional Neural Network，CNN）通过局部连接、权重共享和逐层特征提取，更适合处理图像。低层卷积通常学习边缘、纹理和颜色块，高层卷积逐渐组合出局部形状、物体部件甚至完整类别特征。

## 2. CNN 的核心结构

### 2.1 卷积层

卷积层使用一组可学习的卷积核在图像上滑动，对局部区域做加权计算。每个卷积核会提取一种特征，输出一张特征图。多个卷积核会得到多张特征图，再堆叠成新的张量。

卷积层常见参数包括：

1. `filters`：卷积核数量，也就是输出特征图的通道数。
2. `kernel_size`：卷积核大小，例如 `3 × 3` 或 `5 × 5`。
3. `strides`：卷积核每次滑动的步长。
4. `padding`：边界处理方式，常用 `valid` 或 `same`。
5. `activation`：激活函数，图像模型中常用 `ReLU`。

在 TensorFlow/Keras 中，一个卷积层通常这样写：

```python
from tensorflow.keras import layers

conv = layers.Conv2D(
    filters=32,
    kernel_size=(3, 3),
    padding="same",
    activation="relu"
)
```

### 2.2 池化层

池化层用于降低特征图尺寸，减少计算量，并让模型对局部位置变化更稳定。常见池化方式有最大池化和平均池化。

最大池化会保留局部区域中的最大值，更强调局部显著特征：

```python
pool = layers.MaxPooling2D(pool_size=(2, 2))
```

平均池化会计算局部区域的平均值，更强调整体平滑信息：

```python
pool = layers.AveragePooling2D(pool_size=(2, 2))
```

实际图像分类任务中，`Conv2D + ReLU + MaxPooling2D` 是很常见的基础组合。

### 2.3 全连接层与分类输出

卷积层和池化层负责提取空间特征，最后通常需要把特征送入分类器。常见做法是使用 `Flatten` 展平后接 `Dense` 层，或使用 `GlobalAveragePooling2D` 汇聚空间维度。

对于多分类任务，输出层通常使用 `softmax`：

```python
layers.Dense(num_classes, activation="softmax")
```

如果标签是整数类别，可以搭配 `sparse_categorical_crossentropy` 损失函数；如果标签已经做了 one-hot 编码，则常用 `categorical_crossentropy`。

## 3. 使用 TensorFlow 构建一个 CNN

下面用 MNIST 手写数字识别作为例子。MNIST 图片是 `28 × 28` 的灰度图，类别是数字 `0` 到 `9`。

```python
import tensorflow as tf
from tensorflow.keras import layers, models

(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

# 增加通道维度，并把像素值归一化到 0~1
x_train = x_train.reshape(-1, 28, 28, 1).astype("float32") / 255.0
x_test = x_test.reshape(-1, 28, 28, 1).astype("float32") / 255.0

model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),

    layers.Conv2D(32, (3, 3), padding="same", activation="relu"),
    layers.MaxPooling2D((2, 2)),

    layers.Conv2D(64, (3, 3), padding="same", activation="relu"),
    layers.MaxPooling2D((2, 2)),

    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.3),
    layers.Dense(10, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

model.fit(
    x_train,
    y_train,
    epochs=5,
    batch_size=64,
    validation_split=0.1
)

test_loss, test_acc = model.evaluate(x_test, y_test)
print("test accuracy:", test_acc)
```

这个模型的流程是：

1. 第一组卷积提取低级特征，例如笔画边缘。
2. 第一组池化缩小特征图尺寸。
3. 第二组卷积提取更复杂的笔画组合。
4. 第二组池化继续压缩空间信息。
5. 全连接层根据提取到的特征完成数字分类。

## 4. 经典卷积网络

### 4.1 LeNet-5

LeNet-5 是早期经典 CNN，主要用于手写数字识别。它的思想非常清晰：先用卷积层提取局部特征，再用池化层降维，最后用全连接层分类。

一个简化版 LeNet 风格模型可以写成：

```python
model = models.Sequential([
    layers.Input(shape=(32, 32, 1)),
    layers.Conv2D(6, (5, 5), activation="tanh"),
    layers.AveragePooling2D((2, 2)),
    layers.Conv2D(16, (5, 5), activation="tanh"),
    layers.AveragePooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(120, activation="tanh"),
    layers.Dense(84, activation="tanh"),
    layers.Dense(10, activation="softmax")
])
```

现代实践中，`ReLU`、`MaxPooling2D`、`BatchNormalization` 和更深的网络结构更常见，但 LeNet-5 仍然适合理解 CNN 的基本路径。

### 4.2 Inception-v3

Inception 系列网络的核心思想是：同一层中并行使用不同大小的卷积核和池化操作，让模型同时观察不同尺度的图像特征。这样可以在控制计算量的同时提高特征表达能力。

在 TensorFlow 中，一般不需要手写完整的 Inception-v3 结构，可以直接使用 Keras 内置模型：

```python
base_model = tf.keras.applications.InceptionV3(
    include_top=False,
    weights="imagenet",
    input_shape=(299, 299, 3)
)
```

其中 `include_top=False` 表示不加载原始 ImageNet 分类头，只保留卷积特征提取部分，方便接入自己的分类任务。

## 5. 迁移学习

当训练数据不够多时，从零训练一个深层 CNN 往往效果不好。迁移学习的做法是使用已经在大规模数据集上预训练好的模型，复用它的通用图像特征，再针对自己的任务训练一个新的分类头。

典型流程如下：

1. 加载预训练模型，并去掉原始分类头。
2. 冻结预训练模型的卷积层参数。
3. 添加自己的池化层、Dropout 和分类层。
4. 先训练新分类头。
5. 数据量允许时，解冻部分高层卷积层做微调。

示例代码：

```python
import tensorflow as tf
from tensorflow.keras import layers, models

base_model = tf.keras.applications.MobileNetV2(
    include_top=False,
    weights="imagenet",
    input_shape=(224, 224, 3)
)
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(5, activation="softmax")
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)
```

如果后续要微调模型，可以只解冻靠后的若干层，并使用更小的学习率：

```python
base_model.trainable = True

for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)
```

## 6. 训练图像模型的常见实践

图像识别模型不只依赖网络结构，数据处理和训练策略也很关键。

1. 归一化输入。把像素值缩放到 `0~1`，或者使用预训练模型对应的 `preprocess_input`。
2. 做数据增强。随机翻转、裁剪、旋转、缩放可以提升泛化能力。
3. 使用验证集。通过验证集观察过拟合，不要只看训练集准确率。
4. 加入 Dropout 或正则化。数据量较小时尤其有用。
5. 保存最佳模型。使用 `ModelCheckpoint` 按验证指标保存权重。
6. 关注混淆矩阵。准确率不能说明所有问题，容易混淆的类别需要单独分析。

TensorFlow 的数据增强层可以直接放进模型中：

```python
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1)
])
```

然后在模型开头使用：

```python
model = models.Sequential([
    layers.Input(shape=(224, 224, 3)),
    data_augmentation,
    layers.Rescaling(1.0 / 255),
    layers.Conv2D(32, 3, activation="relu"),
    layers.MaxPooling2D(),
    layers.Flatten(),
    layers.Dense(10, activation="softmax")
])
```

## 7. 小结

卷积神经网络适合图像识别，是因为它能保留并利用图像的局部空间结构。卷积层负责提取特征，池化层负责压缩空间信息，全连接层或全局池化层负责完成分类。LeNet-5 展示了 CNN 的基本形态，Inception-v3 展示了多尺度特征提取的思路，而迁移学习则是工程实践中快速获得可用图像模型的重要方法。

使用 TensorFlow 构建图像识别模型时，可以先从简单的 `Conv2D + MaxPooling2D` 模型入手，再根据数据规模和任务难度选择更深的网络或预训练模型。

参考来源：掘金文章《Tensorflow--图像识别与卷积神经网络》，https://juejin.cn/post/7035784871561658405
