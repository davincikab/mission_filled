import csv

with open('lansing_churches.csv') as file:
    csvFile = csv.reader(file)
    data = []
    for row in csvFile:
        data.append(row)
    
    dictCSV = { 
        0:[]
    }

    # extract the row by index
    j = 0
    for i, k in enumerate(data):
        if(i % 4 == 0):
            j += 1
            dictCSV[j] = []
        else:
            dictCSV[j].append(k[0])

    
    # writing to another csv file
    with open('lansing.csv', 'w', newline='') as newFile:
        churchWriter = csv.writer(newFile, delimiter=',')
        churchWriter.writerow(['Name', 'address', 'group'])
        for k, v in dictCSV.items():
            churchWriter.writerow(v)
            print(v)
    newFile.close()

    file.close()
