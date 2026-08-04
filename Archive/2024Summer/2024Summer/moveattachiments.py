import re  
import os  

# noteName = input('中心节点路径：')  
noteName =  "/Users/szy/Library/Mobile Documents/iCloud~md~obsidian/Documents/2024暑假/期末考试/机器学习/机器学习期末复习.md"

with open(file=noteName, mode='r+', encoding='utf-8') as f:  
    data = f.read()  

pattern = re.compile('```.*?```', re.DOTALL)  
data_list = pattern.split(data)  


regular = '\[\[(.*?\.png)]\]'  
attachment_list = [j for i in data_list for j in re.findall(regular, i)]  
print('附件列表：', attachment_list)


# fileName = input('被复制附件所在原文件夹：')
fileName =  "/Users/szy/SzyOb-Mac/SzyOb/$/2024"
files = os.listdir(fileName)  
print('附件列表：', files)

# 交集  
a_set = set(attachment_list)  
inter = a_set.intersection(files)  


# t = input('复制后附件所在文件夹：')
t = "/Users/szy/Library/Mobile Documents/iCloud~md~obsidian/Documents/2024暑假/期末考试/机器学习/=images"
for i in inter:  
    # 读取文件  
    with open(fileName + '/' + i, 'rb') as f:  
        data = f.read()

    # 复制文件  
    with open(t + '/' + i, 'wb') as f:  
        f.write(data)  
        print('复制成功：', i)


print('附件迁移完毕')
