from random import choice
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired
from datetime import datetime  # 引入datetime来记录时间戳
from flask import Flask, render_template, request, redirect, url_for, flash  # 引入flash来显示搜索提示
import io  # 用于处理图片数据
from flask import send_file  # 用于发送图片文件
import matplotlib.pyplot as plt  # 用于绘制图表
import matplotlib
matplotlib.use('Agg')
from flask import send_from_directory
import os
from flask_login import UserMixin
from flask_login import LoginManager
from flask import session
from flask_login import login_user
from flask_login import current_user


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'mysecret'
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # 新增

class User(db.Model, UserMixin):  # 添加UserMixin
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    messages = db.relationship('Message', backref='author', lazy=True)

class MessageForm(FlaskForm):
    content = StringField('Message:', validators=[DataRequired()], render_kw={
        'class': 'gen-textarea',
        'placeholder': 'Say something...',
        'autocomplete': 'off',
        'autofocus': '',
        'rows': 1})
    submit = SubmitField('Submit')

class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)

# 系统回复的消息
class MessageReply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=False)
    reply_content = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    message = db.relationship('Message', backref=db.backref('replies', lazy='dynamic'))


# 新增登录注册表单
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = StringField('Password', validators=[DataRequired()])
    login = SubmitField('Login')
    register = SubmitField('Register')

@app.route('/login_register', methods=['GET', 'POST'])
def login_register():
    form = LoginForm()
    if form.validate_on_submit():
        if form.login.data:  # 登录逻辑
            user = User.query.filter_by(username=form.username.data).first()
            if user and user.password == form.password.data:
                login_user(user)
                return redirect(url_for('menu'))
            else:
                flash('Invalid username or password!', 'danger')

        if form.register.data:  # 注册逻辑
            user_exists = User.query.filter_by(username=form.username.data).first()
            if user_exists:
                flash('Username already exists!', 'danger')
            else:
                new_user = User(username=form.username.data, password=form.password.data)
                db.session.add(new_user)
                db.session.commit()
                flash('Registration successful. Please login.', 'success')
                return redirect(url_for('login_register'))

    return render_template('login_register.html', form=form)

from random import choice

def add_initial_replies():
    replies_list = ["典", "孝", "绷", "赢", "急", "乐", "麻", "寄","张老板万岁！","讨厌垤帆子","你说得对","Hello,How are you？"]  # 列出要添加的回复
    
    # 检查每一个回复是否已经存在于数据库
    for reply_content in replies_list:
        existing_reply = Reply.query.filter_by(content=reply_content).first()
        if not existing_reply:  # 如果回复不存在，我们将它添加到数据库
            new_reply = Reply(content=reply_content)
            db.session.add(new_reply)
            
    db.session.commit()

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    form = MessageForm()
    search = request.args.get('search', '')
    all_replies = Reply.query.all()

    if form.validate_on_submit():
        message = Message(content=form.content.data, user_id=current_user.id)
        db.session.add(message)
        db.session.commit()

        # 随机从Reply数据库选择一个回复
        if all_replies:
            reply = choice(all_replies)
            message_reply = MessageReply(message_id=message.id, reply_content=reply.content)
            db.session.add(message_reply)
            db.session.commit()

    messages = Message.query.filter_by(user_id=current_user.id).order_by(Message.timestamp.asc())
    if search:
        messages = messages.filter(Message.content.contains(search))
        if not messages.first():
            flash('No messages found!', 'warning')

    messages = messages.all()
    return render_template('chat.html', form=form, messages=messages)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/keywords')
def keywords():
    keyword_count = dict()
    messages = Message.query.all()
    for message in messages:
        words = message.content.split()
        for word in words:
            keyword_count[word] = keyword_count.get(word, 0) + 1
    return render_template('keywords.html', keyword_count=keyword_count)

@app.route('/keywords/plot')
def plot_keywords():
    keyword_count = dict()
    messages = Message.query.all()
    for message in messages:
        words = message.content.split()
        for word in words:
            keyword_count[word] = keyword_count.get(word, 0) + 1
 
    # 绘制图表
    fig, ax = plt.subplots()
    words = list(keyword_count.keys())
    counts = list(keyword_count.values())
    ax.barh(words, counts)
    ax.set_xlabel('Count')
    ax.set_title('Keyword Count')
    
    # 保存图表为图片
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    return send_file(img, mimetype='image/png')

@app.route('/<filename>')
def root_directory_file(filename):
    return send_from_directory(os.path.abspath(os.path.dirname(__file__)), filename)

@app.route('/')
def home():
    return redirect(url_for('login_register'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        add_initial_replies()  # 添加这一行
        app.run(debug=True)